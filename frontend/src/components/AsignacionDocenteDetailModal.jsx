import { X } from 'lucide-react';
import EstadoAsignacionBadge from './EstadoAsignacionBadge';

const text = (value, fallback = 'No registrado') => value ?? fallback;

const getUser = (docente) => docente?.user || docente?.usuario || docente?.persona || {};

const fullName = (docente) => {
  const user = getUser(docente);
  const parts = [
    docente?.nombre,
    docente?.nombres,
    docente?.apellidos,
    user.name,
    user.nombres,
    user.apellidos,
  ].filter(Boolean);

  if (docente?.nombre_completo) return docente.nombre_completo;
  if (user.nombre_completo) return user.nombre_completo;
  if (parts.length) return parts.join(' ');
  return user.email || docente?.correo || 'Docente';
};

const getCorreo = (docente) => docente?.correo || docente?.email || getUser(docente).email || getUser(docente).correo;

const getGrupo = (asignacion) => asignacion?.grupo || asignacion?.grupo_cup || asignacion?.grupoCup || {};

const getMateria = (asignacion) => asignacion?.materia || {};

const getDocente = (asignacion) => asignacion?.docente || {};

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';

const getGruposAsignados = (asignacion) => {
  return asignacion.grupos_asignados_docente
    ?? asignacion.grupos_asignados
    ?? asignacion.asignaciones_activas_docente
    ?? asignacion.docente?.grupos_asignados
    ?? asignacion.docente?.asignaciones_activas
    ?? 0;
};

const getMaxGrupos = (asignacion) => {
  return asignacion.capacidad_grupos_maxima
    ?? asignacion.max_grupos
    ?? 4;
};

const formatDate = (value) => {
  if (!value) return 'No registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AsignacionDocenteDetailModal({ asignacion, onClose }) {
  if (!asignacion) return null;

  const grupo = getGrupo(asignacion);
  const materia = getMateria(asignacion);
  const docente = getDocente(asignacion);
  const materiaHabilitada = docente?.materia_habilitada || docente?.materia || {};

  return (
    <div className="detail-modal-overlay asignacion-modal-overlay" onClick={onClose}>
      <div className="detail-modal asignacion-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle de asignacion</h3>
            <p>Grupo CUP, materia y docente habilitado asignado.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="detail-hero">
          <div>
            <h4>{fullName(docente)}</h4>
            <span>{getCorreo(docente) || 'Sin correo'}</span>
          </div>
          <EstadoAsignacionBadge estado={asignacion.estado} />
        </div>

        <div className="detail-section-title">Grupo</div>
        <div className="detail-grid">
          <div><span>Codigo</span><strong>{text(grupo.codigo)}</strong></div>
          <div><span>Nombre</span><strong>{text(grupo.nombre)}</strong></div>
          <div><span>Cantidad estudiantes</span><strong>{grupo.cantidad_estudiantes ?? grupo.estudiantes_count ?? 0}</strong></div>
        </div>

        <div className="detail-section-title">Materia</div>
        <div className="detail-grid compact">
          <div><span>Nombre</span><strong>{getMateriaNombre(materia)}</strong></div>
        </div>

        <div className="detail-section-title">Docente</div>
        <div className="detail-grid">
          <div><span>Nombre</span><strong>{fullName(docente)}</strong></div>
          <div><span>Correo</span><strong>{getCorreo(docente) || 'No registrado'}</strong></div>
          <div><span>Profesion</span><strong>{text(docente.profesion)}</strong></div>
          <div><span>Especialidad</span><strong>{text(docente.especialidad)}</strong></div>
          <div><span>Materia habilitada</span><strong>{getMateriaNombre(materiaHabilitada)}</strong></div>
          <div><span>Grupos asignados</span><strong>{getGruposAsignados(asignacion)} / {getMaxGrupos(asignacion)}</strong></div>
        </div>

        <div className="detail-section-title">Registro</div>
        <div className="detail-grid compact">
          <div><span>Fecha de creacion</span><strong>{formatDate(asignacion.created_at || asignacion.fecha_creacion)}</strong></div>
        </div>
      </div>
    </div>
  );
}
