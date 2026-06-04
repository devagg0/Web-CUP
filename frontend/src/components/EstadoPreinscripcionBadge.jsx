export default function EstadoPreinscripcionBadge({ estado }) {
  const label = estado || 'DESCONOCIDO';
  const normalized = String(label).toUpperCase();

  const classes = {
    EN_REVISION: 'badge-info',
    OBSERVADO: 'badge-warning',
    INSCRITO: 'badge-success',
    RECHAZADO: 'badge-danger',
    APROBADO: 'badge-success',
  };

  return (
    <span className={`status-badge status-${classes[normalized] ? classes[normalized].replace('badge-', '') : 'default'}`}>
      {label}
    </span>
  );
}
