const normalizeEstado = (estado) => String(estado || 'PENDIENTE').toUpperCase();

export default function EstadoMateriaBadge({ estado }) {
  const normalized = normalizeEstado(estado);
  const className = normalized === 'APROBADO'
    ? 'estado-badge estado-aprobado'
    : normalized === 'REPROBADO'
      ? 'estado-badge estado-reprobado'
      : 'estado-badge estado-pendiente';

  return <span className={className}>{normalized}</span>;
}
