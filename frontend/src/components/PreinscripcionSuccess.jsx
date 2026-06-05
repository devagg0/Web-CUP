import { useNavigate } from 'react-router-dom';

export default function PreinscripcionSuccess({ data }) {
  const navigate = useNavigate();
  const estado = data.estado || data.status || 'EN_REVISION_REQUISITOS';
  const registro = data.registro || data.username || data.user?.registro;
  const contrasena = data.password_temporal || data.contrasena_temporal || data.user?.contrasena_temporal;

  return (
    <div className="success-card">
      <h2>Solicitud enviada correctamente</h2>
      <div className="status-badge">Estado: {estado}</div>
      <p>Tu solicitud ha sido registrada correctamente.</p>
      <p>Tus requisitos serán revisados por administración. Si son aprobados, podrás consultar el estado y realizar el pago.</p>

      {(registro || contrasena) && (
        <div className="credential-box">
          {registro && <p><strong>Registro:</strong> {registro}</p>}
          {contrasena && <p><strong>Contraseña temporal:</strong> {contrasena}</p>}
          <p>Estas credenciales también serán enviadas a tu correo electrónico.</p>
        </div>
      )}

      <div className="button-row success-actions">
        <button type="button" className="btn-secondary" onClick={() => navigate('/consultar-preinscripcion')}>
          Consultar preinscripción
        </button>
        <button type="button" className="btn-primary" onClick={() => navigate('/login')}>
          Volver al login
        </button>
      </div>
    </div>
  );
}
