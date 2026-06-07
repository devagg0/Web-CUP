import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  fecha: today(),
  estado_asistencia: 'DICTADA',
  observacion: '',
};

export default function RegistrarAsistenciaModal({ open, carga, saving = false, backendError = '', onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setErrors({});
  }, [open]);

  if (!open || !carga) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.fecha) nextErrors.fecha = 'Selecciona una fecha.';
    if (!form.estado_asistencia) nextErrors.estado_asistencia = 'Selecciona el estado de asistencia.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(carga, {
      fecha: form.fecha,
      estado_asistencia: form.estado_asistencia,
      observacion: form.observacion.trim(),
    });
  };

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Registrar asistencia</h3>
            <p>Registra el estado de la clase para la fecha seleccionada.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {backendError && <div className="message error">{backendError}</div>}

        <form className="cu12-form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            Fecha *
            <input type="date" value={form.fecha} onChange={(event) => handleChange('fecha', event.target.value)} />
            {errors.fecha && <div className="field-error">{errors.fecha}</div>}
          </label>

          <label className="form-field">
            Estado asistencia *
            <select value={form.estado_asistencia} onChange={(event) => handleChange('estado_asistencia', event.target.value)}>
              <option value="DICTADA">DICTADA</option>
              <option value="NO_DICTADA">NO_DICTADA</option>
              <option value="REPROGRAMADA">REPROGRAMADA</option>
            </select>
            {errors.estado_asistencia && <div className="field-error">{errors.estado_asistencia}</div>}
          </label>

          <label className="form-field full">
            Observacion
            <textarea rows="4" value={form.observacion} onChange={(event) => handleChange('observacion', event.target.value)} />
          </label>

          <div className="form-actions full">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Registrando...' : 'Registrar asistencia'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
