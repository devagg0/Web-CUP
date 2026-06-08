import { Edit3, Eye } from 'lucide-react';
import EstadoMateriaBadge from './EstadoMateriaBadge';

const text = (value) => value || 'No registrado';

const getPostulanteNombre = (nota) => (
  nota?.postulante?.nombre_completo
  || nota?.postulante?.nombre
  || nota?.postulante_nombre
  || [nota?.postulante?.nombres, nota?.postulante?.apellidos].filter(Boolean).join(' ')
  || 'Sin nombre'
);

const getCi = (nota) => nota?.postulante?.ci || nota?.ci || nota?.postulante_ci || 'Sin CI';
const getGrupo = (nota) => nota?.grupo?.codigo || nota?.grupo?.nombre || nota?.grupo_nombre || nota?.grupo_codigo || 'Sin grupo';
const getMateria = (nota) => nota?.materia?.nombre || nota?.materia_nombre || nota?.materia || 'Sin materia';
const getDocente = (nota) => (
  nota?.docente?.nombre_completo
  || nota?.docente?.nombre
  || nota?.docente_nombre
  || [nota?.docente?.nombres, nota?.docente?.apellidos].filter(Boolean).join(' ')
  || 'Sin docente'
);

const getNotaClass = (value) => {
  if (value == null || value === '') return 'nota-cell empty';
  return Number(value) >= 60 ? 'nota-cell pass' : 'nota-cell fail';
};

const notaText = (value) => {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toFixed(0);
};

const finalText = (value) => {
  if (value == null || value === '') return '-';
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toFixed(2);
};

export default function NotasCupTable({ notas = [], canEdit = false, onView, onEdit }) {
  if (!notas.length) {
    return <div className="empty-state">No hay notas registradas para mostrar.</div>;
  }

  return (
    <div className="notas-table-wrapper">
      <table className="notas-table">
        <thead>
          <tr>
            <th>Postulante</th>
            <th>CI</th>
            <th>Grupo</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Parcial 1</th>
            <th>Parcial 2</th>
            <th>Parcial 3</th>
            <th>Nota final</th>
            <th>Estado materia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota, index) => (
            <tr key={nota.id || `${getCi(nota)}-${getMateria(nota)}-${index}`}>
              <td><strong>{getPostulanteNombre(nota)}</strong></td>
              <td>{text(getCi(nota))}</td>
              <td>{text(getGrupo(nota))}</td>
              <td>{text(getMateria(nota))}</td>
              <td>{text(getDocente(nota))}</td>
              <td><span className={getNotaClass(nota.parcial_1)}>{notaText(nota.parcial_1)}</span></td>
              <td><span className={getNotaClass(nota.parcial_2)}>{notaText(nota.parcial_2)}</span></td>
              <td><span className={getNotaClass(nota.parcial_3)}>{notaText(nota.parcial_3)}</span></td>
              <td><strong>{finalText(nota.nota_final)}</strong></td>
              <td><EstadoMateriaBadge estado={nota.estado_materia || nota.estado} /></td>
              <td>
                <div className="row-actions">
                  <button className="icon-action" type="button" onClick={() => onView?.(nota)} title="Ver detalle">
                    <Eye size={17} />
                  </button>
                  {canEdit && (
                    <button className="icon-action primary" type="button" onClick={() => onEdit?.(nota)} title="Editar notas">
                      <Edit3 size={17} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
