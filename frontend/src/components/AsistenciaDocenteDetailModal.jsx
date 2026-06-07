import { X } from 'lucide-react';
import EstadoAsistenciaBadge from './EstadoAsistenciaBadge';

const getGrupo = (item) => item?.grupo || item?.grupo_cup || item?.carga_horaria?.grupo || item?.carga_horaria?.asignacion?.grupo || {};
const getMateria = (item) => item?.materia || item?.carga_horaria?.materia || item?.carga_horaria?.asignacion?.materia || {};
const getAula = (item) => item?.aula || item?.carga_horaria?.aula || {};
const getDocente = (item) => item?.docente || item?.carga_horaria?.docente || item?.carga_horaria?.asignacion?.docente || {};
const getUser = (docente) => docente?.user || docente?.usuario || {};
const fullName = (docente) => docente?.nombre_completo || getUser(docente).nombre_completo || [docente?.nombre, docente?.apellidos].filter(Boolean).join(' ') || getUser(docente).name || 'Docente';
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';
const formatDateTime = (value) => {
  if (!value) return 'No registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO');
};

export default function AsistenciaDocenteDetailModal({ asistencia, onClose }) {
  if (!asistencia) return null;

  const grupo = getGrupo(asistencia);
  const materia = getMateria(asistencia);
  const aula = getAula(asistencia);
  const docente = getDocente(asistencia);

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal cu12-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle de asistencia</h3>
            <p>{fullName(docente)} - {asistencia.fecha || 'Sin fecha'}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="detail-hero">
          <div>
            <h4>{grupo.codigo || 'Grupo CUP'} - {materiaNombre(materia)}</h4>
            <span>{aula.codigo || aula.nombre || 'Aula no registrada'}</span>
          </div>
          <EstadoAsistenciaBadge estado={asistencia.estado_asistencia} />
        </div>

        <div className="detail-section-title">Registro</div>
        <div className="detail-grid">
          <div><span>Docente</span><strong>{fullName(docente)}</strong></div>
          <div><span>Fecha</span><strong>{asistencia.fecha || 'No registrada'}</strong></div>
          <div><span>Observacion</span><strong>{asistencia.observacion || 'Sin observacion'}</strong></div>
          <div><span>Registrado por</span><strong>{asistencia.registrado_por?.name || asistencia.user?.name || asistencia.registrado_por || 'No registrado'}</strong></div>
          <div><span>Fecha registro</span><strong>{formatDateTime(asistencia.created_at || asistencia.fecha_registro)}</strong></div>
          <div><span>Horario</span><strong>{asistencia.carga_horaria?.hora_inicio || '--:--'} - {asistencia.carga_horaria?.hora_fin || '--:--'}</strong></div>
        </div>
      </div>
    </div>
  );
}
