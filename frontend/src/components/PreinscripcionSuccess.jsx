export default function PreinscripcionSuccess({ data }) {
  const estado = data.estado || data.status || 'EN_REVISIÓN';
  const registro = data.registro || data.username || data.user?.registro;
  const contrasena = data.password_temporal || data.contrasena_temporal || data.user?.contrasena_temporal;

  return (
    <div className="success-card">
      <h2>Solicitud enviada correctamente</h2>
      <div className="status-badge">Estado: {estado}</div>
      <p>Tus requisitos y pago serán revisados por administración.</p>
      <p>No cierres ni pierdas tu correo, ahí recibirás las credenciales si tu solicitud es aprobada.</p>

      {(registro || contrasena) && (
        <div className="credential-box">
          {registro && <p><strong>Registro:</strong> {registro}</p>}
          {contrasena && <p><strong>Contraseña temporal:</strong> {contrasena}</p>}
          <p>Estas credenciales también serán enviadas al correo del postulante si el SMTP está configurado.</p>
        </div>
      )}
    </div>
  );
}
