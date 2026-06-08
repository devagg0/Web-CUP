import { AlertTriangle, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  postulante_id: '',
  grupo_id: '',
  materia_id: '',
  docente_id: '',
  parcial_1: '',
  parcial_2: '',
  parcial_3: '',
};

const getId = (value) => value?.id ?? value?.value ?? '';
const getLabel = (value, fallback) => value?.nombre || value?.codigo || value?.nombre_completo || value?.label || fallback;

const toNumber = (value) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const calculateFinal = (form) => {
  const p1 = toNumber(form.parcial_1);
  const p2 = toNumber(form.parcial_2);
  const p3 = toNumber(form.parcial_3);
  if ([p1, p2, p3].some((value) => value == null)) return null;
  return (p1 * 0.3) + (p2 * 0.3) + (p3 * 0.4);
};

const estimateEstado = (form) => {
  const final = calculateFinal(form);
  const parciales = [toNumber(form.parcial_1), toNumber(form.parcial_2), toNumber(form.parcial_3)];
  if (final == null || parciales.some((value) => value == null)) return 'PENDIENTE';
  return parciales.every((value) => value >= 60) && final >= 60 ? 'APROBADO' : 'REPROBADO';
};

const normalizeEditForm = (nota) => ({
  postulante_id: nota?.postulante_id || nota?.postulante?.id || '',
  grupo_id: nota?.grupo_id || nota?.grupo?.id || '',
  materia_id: nota?.materia_id || nota?.materia?.id || '',
  docente_id: nota?.docente_id || nota?.docente?.id || '',
  parcial_1: nota?.parcial_1 ?? '',
  parcial_2: nota?.parcial_2 ?? '',
  parcial_3: nota?.parcial_3 ?? '',
});

export default function NotaCupFormModal({
  open,
  nota,
  grupos = [],
  materias = [],
  docentes = [],
  onClose,
  onSubmit,
  saving = false,
  error = '',
}) {
  const [form, setForm] = useState(initialForm);
  const [localError, setLocalError] = useState('');

  const isEdit = Boolean(nota?.id);
  const final = useMemo(() => calculateFinal(form), [form]);
  const estado = useMemo(() => estimateEstado(form), [form]);
  const hasLowPartial = [form.parcial_1, form.parcial_2, form.parcial_3]
    .map(toNumber)
    .some((value) => value != null && value < 60);

  useEffect(() => {
    if (open) {
      setForm(isEdit ? normalizeEditForm(nota) : initialForm);
      setLocalError('');
    }
  }, [open, isEdit, nota]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const required = ['postulante_id', 'grupo_id', 'materia_id', 'docente_id', 'parcial_1', 'parcial_2', 'parcial_3'];
    if (required.some((field) => form[field] === '' || form[field] == null)) {
      return 'Todos los campos son obligatorios.';
    }

    const notas = [form.parcial_1, form.parcial_2, form.parcial_3].map(Number);
    if (notas.some((value) => Number.isNaN(value))) {
      return 'Las notas deben ser numericas.';
    }
    if (notas.some((value) => value < 0 || value > 100)) {
      return 'Las notas deben estar entre 0 y 100.';
    }
    return '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setLocalError(validation);
      return;
    }

    const payload = isEdit
      ? {
          parcial_1: Number(form.parcial_1),
          parcial_2: Number(form.parcial_2),
          parcial_3: Number(form.parcial_3),
        }
      : {
          postulante_id: Number(form.postulante_id),
          grupo_id: Number(form.grupo_id),
          materia_id: Number(form.materia_id),
          docente_id: Number(form.docente_id),
          parcial_1: Number(form.parcial_1),
          parcial_2: Number(form.parcial_2),
          parcial_3: Number(form.parcial_3),
        };

    onSubmit?.(payload);
  };

  return (
    <div className="detail-modal-overlay examenes-modal-overlay" onClick={onClose}>
      <form className="detail-modal nota-form-modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-title-row">
          <div>
            <h3>{isEdit ? 'Editar notas' : 'Nueva nota CUP'}</h3>
            <p>Registra los tres parciales y revisa el calculo preliminar.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {(localError || error) && <div className="message error">{localError || error}</div>}

        <div className="nota-form-grid">
          <label>
            <span>Postulante ID</span>
            <input
              name="postulante_id"
              type="number"
              min="1"
              placeholder="Ej. 1"
              value={form.postulante_id}
              onChange={handleChange}
              disabled={isEdit}
            />
          </label>

          <label>
            <span>Grupo</span>
            <select name="grupo_id" value={form.grupo_id} onChange={handleChange} disabled={isEdit}>
              <option value="">Seleccionar grupo</option>
              {grupos.map((grupo) => (
                <option key={getId(grupo)} value={getId(grupo)}>
                  {grupo.codigo ? `${grupo.codigo} - ${grupo.nombre || 'Grupo CUP'}` : getLabel(grupo, `Grupo ${getId(grupo)}`)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Materia</span>
            <select name="materia_id" value={form.materia_id} onChange={handleChange} disabled={isEdit}>
              <option value="">Seleccionar materia</option>
              {materias.map((materia) => (
                <option key={getId(materia)} value={getId(materia)}>{getLabel(materia, `Materia ${getId(materia)}`)}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Docente</span>
            <select name="docente_id" value={form.docente_id} onChange={handleChange} disabled={isEdit}>
              <option value="">Seleccionar docente</option>
              {docentes.map((docente) => (
                <option key={getId(docente)} value={getId(docente)}>
                  {docente.nombre_completo || docente.nombre || docente.user?.name || `Docente ${getId(docente)}`}
                </option>
              ))}
            </select>
          </label>

          {['parcial_1', 'parcial_2', 'parcial_3'].map((field, index) => (
            <label key={field}>
              <span>{`Parcial ${index + 1}`}</span>
              <input
                name={field}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0 - 100"
                value={form[field]}
                onChange={handleChange}
              />
            </label>
          ))}
        </div>

        {hasLowPartial && (
          <div className="notice warning inline">
            <AlertTriangle size={17} />
            Esta materia quedara reprobada porque un parcial es menor a 60.
          </div>
        )}

        <div className="live-result">
          <div>
            <span>Nota final calculada</span>
            <strong>{final == null ? 'Pendiente' : final.toFixed(2)}</strong>
          </div>
          <div>
            <span>Estado estimado</span>
            <strong className={`estado-text ${estado.toLowerCase()}`}>{estado}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn-primary btn-inline" type="submit" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>
      </form>
    </div>
  );
}
