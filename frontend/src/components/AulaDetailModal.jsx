import { X } from 'lucide-react';
import EstadoAulaBadge from './EstadoAulaBadge';

export default function AulaDetailModal({ aula, onClose }) {
  if (!aula) return null;

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal cu12-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle del aula</h3>
            <p>{aula.codigo || 'Sin codigo'} - {aula.nombre || 'Aula'}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="detail-hero">
          <div>
            <h4>{aula.nombre || 'Aula'}</h4>
            <span>{aula.ubicacion || 'Sin ubicacion registrada'}</span>
          </div>
          <EstadoAulaBadge estado={aula.estado} />
        </div>

        <div className="detail-section-title">Informacion</div>
        <div className="detail-grid">
          <div><span>Codigo</span><strong>{aula.codigo || 'No registrado'}</strong></div>
          <div><span>Capacidad</span><strong>{aula.capacidad ?? 0} estudiantes</strong></div>
          <div><span>Ubicacion</span><strong>{aula.ubicacion || 'No registrada'}</strong></div>
          <div><span>Estado</span><strong>{aula.estado || 'No registrado'}</strong></div>
        </div>
      </div>
    </div>
  );
}
