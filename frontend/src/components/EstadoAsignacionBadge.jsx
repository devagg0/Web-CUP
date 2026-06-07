const normalizeEstado = (estado) => String(estado || '').toUpperCase();

export default function EstadoAsignacionBadge({ estado }) {
  const value = normalizeEstado(estado);
  const label = value || 'SIN ESTADO';
  const className = value === 'ACTIVA'
    ? 'estado-asignacion-badge activa'
    : 'estado-asignacion-badge inactiva';

  return <span className={className}>{label}</span>;
}
