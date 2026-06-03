import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const emptyValues = {
  nombre: '',
  descripcion: '',
  cupos_totales: '',
  cupos_ocupados: '',
  estado: 'ACTIVA',
};

export default function CarreraForm({ open, onClose, onSubmit, initialValues }) {
  const [form, setForm] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setForm({
        nombre: initialValues.nombre || '',
        descripcion: initialValues.descripcion || '',
        cupos_totales: initialValues.cupos_totales ?? initialValues.cuposTotales ?? '',
        cupos_ocupados: initialValues.cupos_ocupados ?? initialValues.cuposOcupados ?? '',
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

    const totales = Number(form.cupos_totales);
    const ocupados = Number(form.cupos_ocupados);

    if (form.cupos_totales === '') {
      nextErrors.cupos_totales = 'Los cupos totales son obligatorios.';
    } else if (!Number.isInteger(totales) || totales < 0) {
      nextErrors.cupos_totales = 'Debe ser un número entero mayor o igual a 0.';
    }

    if (form.cupos_ocupados === '') {
      nextErrors.cupos_ocupados = 'Los cupos ocupados son obligatorios.';
    } else if (!Number.isInteger(ocupados) || ocupados < 0) {
      nextErrors.cupos_ocupados = 'Debe ser un número entero mayor o igual a 0.';
    }

    if (Number.isInteger(totales) && Number.isInteger(ocupados) && ocupados > totales) {
      nextErrors.cupos_ocupados = 'Los cupos ocupados no pueden ser mayores que los cupos totales.';
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
      descripcion: form.descripcion.trim(),
      cupos_totales: Number(form.cupos_totales),
      cupos_ocupados: Number(form.cupos_ocupados),
      estado: form.estado,
    });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(event) => event.stopPropagation()}>
        <div className="drawer-header">
          <h3>{initialValues ? 'Editar carrera' : 'Nueva carrera'}</h3>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="help-text">Completa los campos para crear o actualizar una carrera con sus cupos.</div>

        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            Nombre de carrera *
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ingrese el nombre de la carrera"
            />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
          </label>

          <label>
            Descripción
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción opcional"
            />
          </label>

          <label>
            Cupos totales *
            <input
              type="number"
              min="0"
              value={form.cupos_totales}
              onChange={(e) => handleChange('cupos_totales', e.target.value)}
              placeholder="0"
            />
            {errors.cupos_totales && <div className="field-error">{errors.cupos_totales}</div>}
          </label>

          <label>
            Cupos ocupados *
            <input
              type="number"
              min="0"
              value={form.cupos_ocupados}
              onChange={(e) => handleChange('cupos_ocupados', e.target.value)}
              placeholder="0"
            />
            {errors.cupos_ocupados && <div className="field-error">{errors.cupos_ocupados}</div>}
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
              Guardar carrera
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
