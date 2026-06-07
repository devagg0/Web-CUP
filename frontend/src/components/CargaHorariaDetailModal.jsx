import { X } from 'lucide-react';
import EstadoCargaHorariaBadge from './EstadoCargaHorariaBadge';

const getAsignacion = (carga) => carga?.asignacion || carga?.asignacion_docente_grupo || {};
const getGrupo = (carga) => carga?.grupo || getAsignacion(carga)?.grupo || getAsignacion(carga)?.grupo_cup || {};
const getMateria = (carga) => carga?.materia || getAsignacion(carga)?.materia || {};
const getDocente = (carga) => carga?.docente || getAsignacion(carga)?.docente || {};
const getUser = (docente) => docente?.user || docente?.usuario || {};
const getAula = (carga) => carga?.aula || {};
const fullName = (docente) => docente?.nombre_completo || getUser(docente).nombre_completo || [docente?.nombre, docente?.apellidos].filter(Boolean).join(' ') || getUser(docente).name || 'Docente';
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';
const hora = (value) => String(value || '--:--').slice(0, 5);

export default function CargaHorariaDetailModal({ carga, onClose }) {
  if (!carga) return null;

  const grupo = getGrupo(carga);
  const materia = getMateria(carga);
  const docente = getDocente(carga);
  const aula = getAula(carga);

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal cu12-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle de carga horaria</h3>
            <p>{grupo.codigo || 'Grupo CUP'} - {materiaNombre(materia)}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="detail-hero">
          <div>
            <h4>{carga.dia_semana || 'Dia'} {hora(carga.hora_inicio)} - {hora(carga.hora_fin)}</h4>
            <span>{aula.codigo || aula.nombre || 'Aula'} - {fullName(docente)}</span>
          </div>
          <EstadoCargaHorariaBadge estado={carga.estado} />
        </div>

        <div className="detail-section-title">Clase asignada</div>
        <div className="detail-grid">
          <div><span>Grupo</span><strong>{grupo.codigo || 'Sin codigo'} - {grupo.nombre || 'Grupo CUP'}</strong></div>
          <div><span>Materia</span><strong>{materiaNombre(materia)}</strong></div>
          <div><span>Docente</span><strong>{fullName(docente)}</strong></div>
          <div><span>Aula</span><strong>{aula.codigo || 'Sin codigo'} - {aula.nombre || 'Aula'}</strong></div>
          <div><span>Turno</span><strong>{carga.turno || 'No registrado'}</strong></div>
          <div><span>Horario</span><strong>{carga.dia_semana || 'Dia'} {hora(carga.hora_inicio)} - {hora(carga.hora_fin)}</strong></div>
        </div>
      </div>
    </div>
  );
}
