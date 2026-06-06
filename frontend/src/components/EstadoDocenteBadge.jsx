const ESTADO_LABELS = {
  PERFIL_PENDIENTE: 'Perfil pendiente',
  EN_REVISION: 'En revisión',
  OBSERVADO: 'Observado',
  HABILITADO: 'Habilitado',
  RECHAZADO: 'Rechazado',
  INACTIVO: 'Inactivo',
};

const ESTADO_CLASSES = {
  PERFIL_PENDIENTE: 'pendiente',
  EN_REVISION: 'revision',
  OBSERVADO: 'observado',
  HABILITADO: 'habilitado',
  RECHAZADO: 'rechazado',
  INACTIVO: 'inactivo',
};

export function getEstadoDocenteLabel(estado) {
  return ESTADO_LABELS[estado] || estado || 'Sin estado';
}

export default function EstadoDocenteBadge({ estado }) {
  const className = ESTADO_CLASSES[estado] || 'pendiente';
  return <span className={`estado-docente-badge ${className}`}>{getEstadoDocenteLabel(estado)}</span>;
}
