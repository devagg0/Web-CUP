import StateBadge from './StateBadge';
import CupoBadge from './CupoBadge';
import { Edit3, ToggleRight, Trash2 } from 'lucide-react';

export default function CarrerasTable({ carreras, onEdit, onToggleEstado, onDelete }) {
  if (!carreras.length) {
    return <div className="no-data">No hay carreras que coincidan con los filtros.</div>;
  }

  return (
    <div className="table-wrapper carreras-table-wrapper">
      <table className="carreras-table">
        <thead>
          <tr>
            <th>Nombre de carrera</th>
            <th>Descripción</th>
            <th>Cupos totales</th>
            <th>Cupos ocupados</th>
            <th>Cupos disponibles</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {carreras.map((carrera) => {
            const total = Number(carrera.cupos_totales ?? carrera.cuposTotales ?? 0);
            const ocupados = Number(carrera.cupos_ocupados ?? carrera.cuposOcupados ?? 0);
            const disponibles = Math.max(0, total - ocupados);

            return (
              <tr key={carrera.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-name">{carrera.nombre}</div>
                  </div>
                </td>
                <td>{carrera.descripcion || 'Sin descripción'}</td>
                <td>{total}</td>
                <td>{ocupados}</td>
                <td>
                  <CupoBadge value={disponibles} total={total} />
                </td>
                <td>
                  <StateBadge estado={carrera.estado} />
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn" type="button" onClick={() => onEdit(carrera)} title="Editar carrera">
                      <Edit3 size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => onToggleEstado(carrera)}
                      title={carrera.estado === 'ACTIVA' ? 'Inactivar carrera' : 'Activar carrera'}
                    >
                      <ToggleRight size={18} />
                    </button>
                    <button className="icon-btn danger" type="button" onClick={() => onDelete(carrera)} title="Desactivar carrera">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
