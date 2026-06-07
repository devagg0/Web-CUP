export default function EstadoAulaBadge({ estado }) {
  const normalized = String(estado || 'INACTIVA').toUpperCase();
  return (
    <span className={`estado-aula-badge ${normalized === 'ACTIVA' ? 'activa' : 'inactiva'}`}>
      {normalized}
    </span>
  );
}
