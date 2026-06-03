import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const emptyValues = {
  nombre: '',
  codigo: '',
  descripcion: '',
  estado: 'ACTIVA',
};

export default function MateriaForm({ open, onClose, onSubmit, initialValues }) {
  const [form, setForm] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (initialValues && initialValues.id) {
      setForm({
        nombre: initialValues.nombre || '',
        codigo: initialValues.codigo || '',
        descripcion: initialValues.descripcion || '',
        estado: initialValues.estado || 'ACTIVA',
      });
    } else {
      setForm(emptyValues);
    }
    setErrors({});
  }, [initialValues, open]);

  if (!open) {
    return null;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio.';
    }

    if (!form.codigo.trim()) {
      nextErrors.codigo = 'El código es obligatorio.';
    } else if (form.codigo.trim().length > 20) {
      nextErrors.codigo = 'El código no puede tener más de 20 caracteres.';
    }

    if (!form.estado) {
      nextErrors.estado = 'El estado es obligatorio.';
    }

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
      nombre: form.nombre.trim(),
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim(),
      estado: form.estado,
    });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h3>{initialValues?.id ? 'Editar materia' : 'Nueva materia'}</h3>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="help-text">Completa los datos de la materia para mantener el catálogo institucional actualizado.</div>

        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            Nombre de la materia *
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ingrese el nombre de la materia"
            />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
          </label>

          <label>
            Código *
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => handleChange('codigo', e.target.value)}
              placeholder="Ingrese el código de la materia"
              maxLength={20}
            />
            {errors.codigo && <div className="field-error">{errors.codigo}</div>}
          </label>

          <label>
            Descripción
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción opcional"
              rows={4}
            />
          </label>

          <label>
            Estado *
            <select value={form.estado} onChange={(e) => handleChange('estado', e.target.value)}>
              <option value="">Seleccionar estado</option>
              <option value="ACTIVA">ACTIVA</option>
              <option value="INACTIVA">INACTIVA</option>
            </select>
            {errors.estado && <div className="field-error">{errors.estado}</div>}
          </label>

          <div className="form-actions">
            <button className="btn-secondary" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit">
              {initialValues?.id ? 'Guardar materia' : 'Crear materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
