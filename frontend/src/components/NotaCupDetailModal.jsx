import { X } from 'lucide-react';
import EstadoMateriaBadge from './EstadoMateriaBadge';

const text = (value) => value || 'No registrado';

const nombrePostulante = (nota) => (
  nota?.postulante?.nombre_completo
  || nota?.postulante?.nombre
  || nota?.postulante_nombre
  || [nota?.postulante?.nombres, nota?.postulante?.apellidos].filter(Boolean).join(' ')
  || 'Sin nombre'
);

const nombreDocente = (nota) => (
  nota?.docente?.nombre_completo
  || nota?.docente?.nombre
  || nota?.docente_nombre
  || [nota?.docente?.nombres, nota?.docente?.apellidos].filter(Boolean).join(' ')
  || 'Sin docente'
);

const materia = (nota) => nota?.materia?.nombre || nota?.materia_nombre || nota?.materia || 'Sin materia';
const grupo = (nota) => nota?.grupo?.codigo || nota?.grupo?.nombre || nota?.grupo_nombre || nota?.grupo_codigo || 'Sin grupo';
const ci = (nota) => nota?.postulante?.ci || nota?.ci || nota?.postulante_ci || 'Sin CI';

const final = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? '-' : number.toFixed(2);
};

export default function NotaCupDetailModal({ nota, onClose }) {
  if (!nota) return null;

  return (
    <div className="detail-modal-overlay examenes-modal-overlay" onClick={onClose}>
      <div className="detail-modal nota-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle de nota CUP</h3>
            <p>Revision academica de la materia evaluada.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="nota-detail-grid">
          <div className="detail-info-card wide">
            <span>Postulante</span>
            <strong>{nombrePostulante(nota)}</strong>
          </div>
          <div className="detail-info-card">
            <span>CI</span>
            <strong>{text(ci(nota))}</strong>
          </div>
          <div className="detail-info-card">
            <span>Grupo</span>
            <strong>{text(grupo(nota))}</strong>
          </div>
          <div className="detail-info-card">
            <span>Materia</span>
            <strong>{text(materia(nota))}</strong>
          </div>
          <div className="detail-info-card wide">
            <span>Docente</span>
            <strong>{text(nombreDocente(nota))}</strong>
          </div>
        </div>

        <div className="nota-score-grid">
          <div><span>Parcial 1</span><strong>{text(nota.parcial_1)}</strong></div>
          <div><span>Parcial 2</span><strong>{text(nota.parcial_2)}</strong></div>
          <div><span>Parcial 3</span><strong>{text(nota.parcial_3)}</strong></div>
          <div><span>Nota final</span><strong>{final(nota.nota_final)}</strong></div>
          <div><span>Estado</span><EstadoMateriaBadge estado={nota.estado_materia || nota.estado} /></div>
        </div>

        <div className="rule-box">
          Para aprobar la materia, los tres parciales y la nota final deben ser mayor o igual a 60.
        </div>
      </div>
    </div>
  );
}
