import MateriaBadge from './MateriaBadge';
import { Edit3, ToggleRight, Trash2 } from 'lucide-react';

export default function MateriasTable({ materias, onEdit, onToggleEstado, onDelete }) {
  if (!materias?.length) {
    return <div className="no-data">No hay materias que coincidan con los filtros.</div>;
  }

  return (
    <div className="table-wrapper materias-table-wrapper">
      <table className="materias-table">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Código</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {materias.map((materia) => (
            <tr key={materia.id}>
              <td>
                <div className="user-cell">
                  <div className="user-name">{materia.nombre}</div>
                </div>
              </td>
              <td>{materia.codigo}</td>
              <td>{materia.descripcion || 'Sin descripción'}</td>
              <td>
                <MateriaBadge estado={materia.estado} />
              </td>
              <td>{materia.created_at || materia.fecha_registro || materia.fechaCreacion || '—'}</td>
              <td>
                <div className="actions-cell">
                  <button className="icon-btn" type="button" onClick={() => onEdit(materia)} title="Editar materia">
                    <Edit3 size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => onToggleEstado(materia)}
                    title={materia.estado === 'ACTIVA' ? 'Inactivar materia' : 'Activar materia'}
                  >
                    <ToggleRight size={18} />
                  </button>
                  <button className="icon-btn danger" type="button" onClick={() => onDelete(materia)} title="Desactivar materia">
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
