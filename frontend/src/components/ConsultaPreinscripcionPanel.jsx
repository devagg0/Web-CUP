import { useMemo, useState } from 'react';
import * as preinscripcionService from '../services/preinscripcion';

const estadoLabels = {
  EN_REVISION_REQUISITOS: 'En revisión de requisitos',
  REQUISITOS_OBSERVADOS: 'Requisitos observados',
  PAGO_HABILITADO: 'Pago habilitado',
  PAGO_EN_REVISION: 'Pago en revisión',
  PAGO_OBSERVADO: 'Pago observado',
  INSCRITO: 'Inscrito',
  RECHAZADO: 'Rechazado',
};

function formatEstado(estado) {
  return estadoLabels[String(estado).toUpperCase()] || estado || 'Desconocido';
}

export default function ConsultaPreinscripcionPanel({
  onSearch,
  onUpload,
  loading,
  uploadLoading,
  error,
  uploadError,
  uploadSuccess,
  result,
}) {
  const [ci, setCi] = useState('');
  const [correo, setCorreo] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const estado = useMemo(() => String(result?.estado_preinscripcion || result?.estado || result?.status || '').toUpperCase(), [result]);

  const validateSearch = () => {
    const nextErrors = {};
    if (!ci.trim()) nextErrors.ci = 'La CI es obligatoria.';
    if (!correo.trim()) nextErrors.correo = 'El correo es obligatorio.';
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!validateSearch()) return;
    onSearch({ ci: ci.trim(), correo: correo.trim() });
  };

  const handleStripePayment = async () => {
    setStripeLoading(true);
    setStripeError('');
    try {
      const response = await preinscripcionService.iniciarPagoStripe(ci.trim(), correo.trim());
      if (response.data && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setStripeError('No se recibió la URL de pago de Stripe.');
      }
    } catch (err) {
      console.error('Error al iniciar pago Stripe:', err);
      if (err.response?.data?.message) {
        setStripeError(err.response.data.message);
      } else {
        setStripeError('Error al iniciar el pago con Stripe. Intente nuevamente.');
      }
    } finally {
      setStripeLoading(false);
    }
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    if (!comprobante) {
      setFormErrors({ comprobante: 'Selecciona un comprobante para enviar.' });
      return;
    }

    const formData = new FormData();
    formData.append('ci', ci.trim());
    formData.append('correo', correo.trim());
    formData.append('comprobante_pago', comprobante);
    onUpload(formData);
  };

  return (
    <div className="consulta-panel">
      <form className="consulta-form" onSubmit={handleSearchSubmit}>
        <div className="field-grid single">
          <div className="field-group">
            <label htmlFor="consulta-ci">CI</label>
            <input
              id="consulta-ci"
              value={ci}
              onChange={(e) => {
                setCi(e.target.value);
                setFormErrors((prev) => ({ ...prev, ci: '' }));
              }}
              placeholder="Ej. 1234567"
            />
            {formErrors.ci && <span className="field-error">{formErrors.ci}</span>}
          </div>
          <div className="field-group">
            <label htmlFor="consulta-correo">Correo electrónico</label>
            <input
              id="consulta-correo"
              type="email"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value);
                setFormErrors((prev) => ({ ...prev, correo: '' }));
              }}
              placeholder="Ej. ejemplo@correo.com"
            />
            {formErrors.correo && <span className="field-error">{formErrors.correo}</span>}
          </div>
        </div>

        <div className="button-row">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}
      </form>

      {result && (
        <div className="consulta-result-card">
          <div className="result-header">
            <h3>Resultado de la consulta</h3>
            <span className="status-badge status-info">{formatEstado(estado)}</span>
          </div>

          <div className="result-details">
            <p><strong>CI:</strong> {result.ci || '—'}</p>
            <p><strong>Nombre:</strong> {result.nombres ? `${result.nombres} ${result.apellidos || ''}`.trim() : '—'}</p>
            <p><strong>Correo:</strong> {result.correo || '—'}</p>
            <p><strong>Primera carrera:</strong> {result.primera_carrera?.nombre || result.primera_carrera || '—'}</p>
            <p><strong>Segunda carrera:</strong> {result.segunda_carrera?.nombre || result.segunda_carrera || '—'}</p>
          </div>

          {estado === 'EN_REVISION_REQUISITOS' && (
            <div className="status-card info-card">
              <p>Tus documentos están siendo revisados por administración.</p>
            </div>
          )}

          {estado === 'REQUISITOS_OBSERVADOS' && (
            <div className="status-card warning-card">
              <p>Tu solicitud presenta observaciones. Revisa el mensaje del admin y sigue sus instrucciones.</p>
              {(result.observacion || result.observacion_admin) && <p><strong>Observación:</strong> {result.observacion || result.observacion_admin}</p>}
            </div>
          )}

          {(estado === 'PAGO_HABILITADO' || estado === 'PAGO_OBSERVADO') && (
            <div className="payment-section">
              <div className={`status-card ${estado === 'PAGO_OBSERVADO' ? 'warning-card' : 'info-card'}`}>
                {estado === 'PAGO_OBSERVADO' ? (
                  <>
                    <p><strong>Pago observado</strong></p>
                    <p>Tu pago previo fue observado por administración.</p>
                    {(result.observacion || result.observacion_admin) && <p><strong>Observación:</strong> {result.observacion || result.observacion_admin}</p>}
                    <p>Puedes proceder a realizar el pago oficial mediante Stripe para que administración vuelva a verificar tu inscripción.</p>
                  </>
                ) : (
                  <>
                    <p><strong>Pago habilitado</strong></p>
                    <p>Tus requisitos fueron aprobados. Ya puedes realizar el pago para completar tu inscripción.</p>
                  </>
                )}
              </div>

              <div className="stripe-payment-container">
                <p>Para su comodidad y seguridad, el pago se procesa a través de la pasarela de pagos internacional <strong>Stripe</strong>.</p>
                
                <div className="stripe-details-card">
                  <div className="detail-row">
                    <span className="detail-label">Concepto:</span>
                    <span className="detail-value">Derecho de Inscripción CUP</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Monto:</span>
                    <span className="detail-value">100.00 USD</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Método de pago:</span>
                    <span className="detail-value">Tarjetas Débito / Crédito</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-stripe-pay"
                  onClick={handleStripePayment}
                  disabled={stripeLoading}
                >
                  {stripeLoading ? (
                    <>Cargando pasarela...</>
                  ) : (
                    <>
                      <span>Pagar inscripción con Stripe</span>
                    </>
                  )}
                </button>
                {stripeError && <div className="form-error">{stripeError}</div>}
              </div>
            </div>
          )}

          {estado === 'PAGO_EN_REVISION' && (
            <div className="status-card info-card">
              <p>Tu comprobante/pago está en revisión.</p>
            </div>
          )}


          {estado === 'INSCRITO' && (
            <div className="status-card success-status-card">
              <p>Tu inscripción fue aprobada.</p>
              <p>Se enviaron las credenciales a tu correo.</p>
              {result.registro && <p><strong>Registro:</strong> {result.registro}</p>}
              {result.password_temporal && <p><strong>Contraseña temporal:</strong> {result.password_temporal}</p>}
            </div>
          )}

          {estado === 'RECHAZADO' && (
            <div className="status-card danger-card">
              <p>Tu solicitud fue rechazada.</p>
              {result.observacion && <p><strong>Motivo:</strong> {result.observacion}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
