const classByEstado = {
  DICTADA: 'dictada',
  NO_DICTADA: 'no-dictada',
  REPROGRAMADA: 'reprogramada',
};

export default function EstadoAsistenciaBadge({ estado }) {
  const normalized = String(estado || 'SIN_REGISTRO').toUpperCase();
  return (
    <span className={`estado-asistencia-badge ${classByEstado[normalized] || 'pendiente'}`}>
      {normalized.replace('_', ' ')}
    </span>
  );
}
