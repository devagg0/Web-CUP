import { ESTADOS } from '../utils/estadoPreinscripcion';

export default function EstadoPreinscripcionBadge({ estado }) {
  const key = String(estado || '').toUpperCase();
  const meta = ESTADOS[key];
  const label = meta ? meta.label : (estado || 'Desconocido');
  const color = meta ? meta.color : 'default';

  return (
    <span className={`status-badge status-${color}`}>
      {label}
    </span>
  );
}
