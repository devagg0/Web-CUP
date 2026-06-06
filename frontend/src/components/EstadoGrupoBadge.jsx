const normalizeEstado = (estado) => String(estado || '').toUpperCase();

export default function EstadoGrupoBadge({ estado }) {
  const normalized = normalizeEstado(estado);
  const isHabilitado = normalized === 'HABILITADO';
  const label = normalized || 'SIN ESTADO';

  return (
    <span className={`estado-grupo-badge ${isHabilitado ? 'habilitado' : 'inactivo'}`}>
      {label}
    </span>
  );
}
