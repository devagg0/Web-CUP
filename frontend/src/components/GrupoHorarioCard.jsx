import { ChevronDown, ChevronUp, Clock, MapPin, Moon, Sun, Sunset, UserRound } from 'lucide-react';

const formatValue = (value, fallback = 'No registrado') => value || fallback;

const turnIcon = {
  manana: Sun,
  mañana: Sun,
  tarde: Sunset,
  noche: Moon,
};

export default function GrupoHorarioCard({ item, expanded, onToggle }) {
  const TurnIcon = turnIcon[item.turnoKey] || Clock;
  const hasDetails = item.detalles.length > 0;

  return (
    <article className={`grupo-horario-card turno-${item.turnoKey || 'general'}`}>
      <div className="grupo-card-topline">
        <span className="grupo-day">{formatValue(item.dia, 'Día pendiente')}</span>
        <span className="grupo-turno-badge">
          <TurnIcon size={15} />
          {formatValue(item.turno, 'Turno pendiente')}
        </span>
      </div>

      <div className="grupo-card-main">
        <h3>{formatValue(item.materia, 'Materia pendiente')}</h3>
        <div className="grupo-hour">
          <Clock size={18} />
          <strong>{item.horaInicio} - {item.horaFin}</strong>
        </div>
      </div>

      <div className="grupo-card-meta">
        <span>
          <UserRound size={16} />
          {formatValue(item.docente, 'Docente por confirmar')}
        </span>
        <span>
          <MapPin size={16} />
          {formatValue(item.aula, 'Aula por confirmar')}
        </span>
      </div>

      {hasDetails && (
        <>
          <button className="grupo-detail-toggle" type="button" onClick={onToggle} aria-expanded={expanded}>
            {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </button>

          {expanded && (
            <div className="grupo-card-details">
              {item.detalles.map((detail) => (
                <div key={detail.label}>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}
