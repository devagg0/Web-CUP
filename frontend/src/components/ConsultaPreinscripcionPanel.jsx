import { useMemo, useState } from 'react';
import FileUploadBox from './FileUploadBox';
import QRPaymentBox from './QRPaymentBox';

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

          {estado === 'PAGO_HABILITADO' && (
            <div className="payment-section">
              <div className="status-card info-card">
                <p><strong>Pago habilitado</strong></p>
                <p>Tus requisitos fueron aprobados. Ya puedes realizar el pago para completar tu inscripción.</p>
              </div>
              <QRPaymentBox />
              <form className="consulta-form" onSubmit={handleUploadSubmit}>
                <div className="field-grid single">
                  <FileUploadBox
                    label="Comprobante de pago"
                    file={comprobante}
                    onChange={(file) => {
                      setComprobante(file);
                      setFormErrors((prev) => ({ ...prev, comprobante: '' }));
                    }}
                    error={formErrors.comprobante || uploadError}
                    required
                  />
                </div>
                <div className="button-row">
                  <button type="submit" className="btn-primary" disabled={uploadLoading}>
                    {uploadLoading ? 'Enviando comprobante...' : 'Enviar comprobante'}
                  </button>
                </div>
                {uploadSuccess && <div className="form-message success-card"><strong>✓ Éxito</strong><p>{uploadSuccess}</p></div>}
              </form>
            </div>
          )}

          {estado === 'PAGO_EN_REVISION' && (
            <div className="status-card info-card">
              <p>Tu comprobante está en revisión.</p>
            </div>
          )}

          {estado === 'PAGO_OBSERVADO' && (
            <div className="status-card warning-card">
              <p>Tu comprobante fue observado por administración.</p>
              {(result.observacion || result.observacion_admin) && <p><strong>Observación:</strong> {result.observacion || result.observacion_admin}</p>}
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
