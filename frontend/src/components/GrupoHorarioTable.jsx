import { ChevronDown, ChevronUp } from 'lucide-react';

export default function GrupoHorarioTable({ items, expandedIds, onToggle }) {
  return (
    <div className="grupo-table-wrapper">
      <table className="grupo-horario-table">
        <thead>
          <tr>
            <th>Día</th>
            <th>Hora</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Aula</th>
            <th>Turno</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const expanded = expandedIds.has(item.id);
            return (
              <tr key={item.id}>
                <td><strong>{item.dia}</strong></td>
                <td>{item.horaInicio} - {item.horaFin}</td>
                <td>{item.materia}</td>
                <td>{item.docente}</td>
                <td>{item.aula}</td>
                <td><span className={`grupo-turno-chip turno-${item.turnoKey || 'general'}`}>{item.turno}</span></td>
                <td>
                  {item.detalles.length > 0 ? (
                    <button className="grupo-table-toggle" type="button" onClick={() => onToggle(item.id)} aria-expanded={expanded}>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {expanded ? 'Ocultar' : 'Ver'}
                    </button>
                  ) : (
                    <span className="grupo-muted">Sin extras</span>
                  )}
                  {expanded && (
                    <div className="grupo-table-details">
                      {item.detalles.map((detail) => (
                        <p key={detail.label}><strong>{detail.label}:</strong> {detail.value}</p>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
