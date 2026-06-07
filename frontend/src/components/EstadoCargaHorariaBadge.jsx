export default function EstadoCargaHorariaBadge({ estado }) {
  const normalized = String(estado || 'INACTIVA').toUpperCase();
  return (
    <span className={`estado-carga-badge ${normalized === 'ACTIVA' ? 'activa' : 'inactiva'}`}>
      {normalized}
    </span>
  );
}
