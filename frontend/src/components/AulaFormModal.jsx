import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const emptyForm = {
  codigo: '',
  nombre: '',
  capacidad: '',
  ubicacion: '',
  estado: 'ACTIVA',
};

export default function AulaFormModal({ open, aula, saving = false, backendError = '', onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm({
      codigo: aula?.codigo || '',
      nombre: aula?.nombre || '',
      capacidad: aula?.capacidad || '',
      ubicacion: aula?.ubicacion || '',
      estado: aula?.estado || 'ACTIVA',
    });
    setErrors({});
  }, [aula, open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.codigo.trim()) nextErrors.codigo = 'El codigo es obligatorio.';
    if (!form.nombre.trim()) nextErrors.nombre = 'El nombre es obligatorio.';
    if (!form.capacidad || Number(form.capacidad) <= 0) nextErrors.capacidad = 'La capacidad debe ser mayor a 0.';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      capacidad: Number(form.capacidad),
      ubicacion: form.ubicacion.trim(),
      estado: form.estado,
    });
  };

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>{aula ? 'Editar aula' : 'Nueva aula'}</h3>
            <p>Registra aulas disponibles para programar clases del CUP.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {backendError && <div className="message error">{backendError}</div>}

        <form className="cu12-form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            Codigo *
            <input value={form.codigo} onChange={(event) => handleChange('codigo', event.target.value)} />
            {errors.codigo && <div className="field-error">{errors.codigo}</div>}
          </label>

          <label className="form-field">
            Nombre *
            <input value={form.nombre} onChange={(event) => handleChange('nombre', event.target.value)} />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
          </label>

          <label className="form-field">
            Capacidad *
            <input type="number" min="1" value={form.capacidad} onChange={(event) => handleChange('capacidad', event.target.value)} />
            {errors.capacidad && <div className="field-error">{errors.capacidad}</div>}
          </label>

          <label className="form-field">
            Estado
            <select value={form.estado} onChange={(event) => handleChange('estado', event.target.value)}>
              <option value="ACTIVA">ACTIVA</option>
              <option value="INACTIVA">INACTIVA</option>
            </select>
          </label>

          <label className="form-field full">
            Ubicacion
            <input value={form.ubicacion} onChange={(event) => handleChange('ubicacion', event.target.value)} />
          </label>

          <div className="form-actions full">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar aula'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
