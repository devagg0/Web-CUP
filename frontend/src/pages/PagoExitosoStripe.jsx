import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { confirmarPagoStripe } from '../services/preinscripcion';
import '../styles/preinscripcion.css';

export default function PagoExitosoStripe() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Falta el ID de sesión de Stripe para confirmar el pago.');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await confirmarPagoStripe(sessionId);
        if (response.data?.success) {
          setPaymentData(response.data.data);
        } else {
          setError(response.data?.message || 'No se pudo verificar el pago con Stripe.');
        }
      } catch (err) {
        console.error('Error al verificar pago Stripe:', err);
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Ocurrió un error al verificar tu pago con el servidor.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="public-shell">
      <div className="public-header-panel no-print">
        <div className="public-header-card">
          <div className="public-badge">UAGRM - FICCT</div>
          <h1>Pago de Inscripción</h1>
          <p>Comprobación e impresión de recibo de pago.</p>
        </div>
      </div>

      <main className="public-main">
        <div className="public-content">
          {loading && (
            <div className="success-card">
              <div className="loading-spinner"></div>
              <h2>Verificando su pago con Stripe...</h2>
              <p>Por favor, no cierre esta ventana mientras registramos su transacción en nuestro sistema.</p>
            </div>
          )}

          {error && (
            <div className="success-card" style={{ borderColor: '#fecaca', background: '#fff1f2' }}>
              <div className="success-logo-container">
                <span className="success-badge-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>✗</span>
              </div>
              <h2 style={{ color: '#991b1b' }}>Error en la verificación</h2>
              <p>{error}</p>
              <div className="button-row success-actions no-print">
                <Link to="/consultar-preinscripcion" className="btn-primary">
                  Volver a Consultar
                </Link>
              </div>
            </div>
          )}

          {paymentData && (
            <div className="success-card">
              <div className="success-logo-container no-print">
                <span className="success-badge-icon">✓</span>
              </div>

              <div className="no-print">
                <h2>¡Pago Registrado con Éxito!</h2>
                <div className="status-badge">Estado: {paymentData.estado}</div>
                <p>
                  Su pago ha sido recibido y registrado como <strong>Pendiente de Validación</strong>.
                  El administrador revisará los datos de la transacción en el panel correspondiente.
                </p>
                <p className="no-print">
                  Una vez que el administrador apruebe su pago, su estado cambiará a <strong>INSCRITO</strong>,
                  se generarán sus credenciales de acceso y le serán enviadas automáticamente por correo electrónico.
                </p>
              </div>

              {/* Printable Voucher Section */}
              <div className="printable-voucher summary-item" style={{ textAlign: 'left', marginTop: '24px', padding: '30px', border: '2px solid #cbd5e1', borderRadius: '18px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', color: '#003b73', fontSize: '1.4rem' }}>FICCT - UAGRM</h3>
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>COMPROBANTE DE PAGO DE PREINSCRIPCIÓN (VOUCHER)</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Fecha de Emisión</span>
                    <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: '0.95rem' }}>{new Date().toLocaleString()}</p>
                  </div>
                </div>

                <div className="field-grid" style={{ marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Postulante</label>
                    <p style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f2742' }}>
                      {paymentData.nombres} {paymentData.apellidos}
                    </p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cédula de Identidad (CI)</label>
                    <p style={{ margin: '4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f2742' }}>
                      {paymentData.ci}
                    </p>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#003b73', fontSize: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>Detalle de Transacción Stripe</h4>
                  <div className="payment-info" style={{ gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>ID de Sesión:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all', marginLeft: '10px' }}>{paymentData.stripe_session_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>ID de Intento de Pago (Payment Intent):</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all', marginLeft: '10px' }}>{paymentData.stripe_payment_intent_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>Fecha de Pago:</span>
                      <span style={{ fontWeight: 600 }}>{paymentData.fecha_pago}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>Monto Pagado:</span>
                      <span style={{ fontWeight: 700, color: '#166534' }}>{paymentData.monto} USD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>Método de Pago:</span>
                      <span style={{ fontWeight: 600 }}>Stripe modo prueba</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#475569', fontWeight: 500 }}>Estado del Registro:</span>
                      <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{paymentData.estado}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '12px' }}>
                  Este documento es un comprobante de pago digital emitido por el Sistema de Preinscripción CUP - FICCT.
                </div>
              </div>

              <div className="button-row success-actions no-print">
                <button onClick={handlePrint} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  🖨️ Imprimir Recibo / Voucher
                </button>
                <Link to="/consultar-preinscripcion" className="btn-primary">
                  Ver mi Estado General
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
