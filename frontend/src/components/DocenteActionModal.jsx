import { useState } from 'react';
import { X } from 'lucide-react';

const copy = {
  observe: {
    title: 'Observar docente',
    description: 'Registra la observación para que el docente corrija su perfil.',
    label: 'Observación admin *',
    button: 'Confirmar observación',
  },
  reject: {
    title: 'Rechazar docente',
    description: 'Indica el motivo del rechazo del perfil docente.',
    label: 'Motivo de rechazo *',
    button: 'Confirmar rechazo',
  },
};

export default function DocenteActionModal({ open, type, docente, loading, error, onClose, onConfirm }) {
  const [observacion, setObservacion] = useState('');
  const [fieldError, setFieldError] = useState('');

  if (!open || !type) return null;

  const data = copy[type];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!observacion.trim()) {
      setFieldError('La observación es obligatoria.');
      return;
    }
    await onConfirm(observacion.trim());
    setObservacion('');
    setFieldError('');
  };

  return (
    <div className="detail-modal-overlay docente-modal-overlay" onClick={onClose}>
      <div className="detail-modal docente-action-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>{data.title}</h3>
            <p>{data.description}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="form-field full">
            {data.label}
            <textarea
              rows={5}
              value={observacion}
              onChange={(e) => {
                setObservacion(e.target.value);
                setFieldError('');
              }}
              placeholder={`Escribe la observación para ${docente?.user?.name || docente?.usuario?.name || 'el docente'}`}
            />
            {fieldError && <div className="field-error">{fieldError}</div>}
          </label>

          {error && <div className="message error">{error}</div>}

          <div className="form-actions">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : data.button}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
