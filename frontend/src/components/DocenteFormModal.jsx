import { useEffect, useMemo, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

const emptyForm = {
  user_id: '',
  ci: '',
  telefono: '',
  profesion: '',
  especialidad: '',
  materia_id: '',
  tiene_maestria: false,
  tiene_diplomado: false,
  anios_experiencia: '',
  titulo_profesional: null,
  certificado_maestria: null,
  certificado_diplomado: null,
  cv: null,
};

const getUser = (docente) => docente?.user || docente?.usuario || {};

const getMateriaId = (docente) => docente?.materia_id || docente?.materia?.id || docente?.materia_habilitada?.id || '';

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || `Materia ${materia?.id}`;

const fieldLabels = {
  titulo_profesional: 'Título profesional',
  certificado_maestria: 'Certificado de maestría',
  certificado_diplomado: 'Certificado de diplomado',
  cv: 'CV',
};

const fileFields = ['titulo_profesional', 'certificado_maestria', 'certificado_diplomado', 'cv'];

function buildName(user) {
  const parts = [user.name, user.nombres, user.apellidos].filter(Boolean);
  return parts.length ? parts.join(' ') : user.nombre_completo || user.email || 'Usuario docente';
}

export function buildDocenteFormData(form, includeUser = true) {
  const formData = new FormData();

  if (includeUser) {
    formData.append('user_id', form.user_id);
  }

  formData.append('ci', form.ci.trim());
  formData.append('telefono', form.telefono.trim());
  formData.append('profesion', form.profesion.trim());
  formData.append('especialidad', form.especialidad.trim());
  formData.append('materia_id', form.materia_id);
  formData.append('tiene_maestria', form.tiene_maestria ? '1' : '0');
  formData.append('tiene_diplomado', form.tiene_diplomado ? '1' : '0');
  formData.append('anios_experiencia', form.anios_experiencia === '' ? '0' : form.anios_experiencia);

  fileFields.forEach((field) => {
    if (form[field] instanceof File) {
      formData.append(field, form[field]);
    }
  });

  return formData;
}

export default function DocenteFormModal({
  open,
  mode = 'admin',
  docente,
  usuarios = [],
  materias = [],
  loadingOptions = false,
  saving = false,
  backendError = '',
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(docente?.id);
  const isDocenteMode = mode === 'docente';
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (docente) {
      const user = getUser(docente);
      setForm({
        ...emptyForm,
        user_id: docente.user_id || user.id || '',
        ci: docente.ci || '',
        telefono: docente.telefono || '',
        profesion: docente.profesion || '',
        especialidad: docente.especialidad || '',
        materia_id: getMateriaId(docente),
        tiene_maestria: Boolean(docente.tiene_maestria),
        tiene_diplomado: Boolean(docente.tiene_diplomado),
        anios_experiencia: docente.anios_experiencia ?? docente.anios_experiencia_docente ?? '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [docente, open]);

  const selectedUser = useMemo(() => {
    if (!form.user_id) return null;
    return usuarios.find((user) => String(user.id) === String(form.user_id)) || getUser(docente);
  }, [docente, form.user_id, usuarios]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!isDocenteMode && !isEditing && !form.user_id) nextErrors.user_id = 'Selecciona un usuario docente.';
    if (!form.ci.trim()) nextErrors.ci = 'El CI es obligatorio.';
    if (!form.telefono.trim()) nextErrors.telefono = 'El teléfono es obligatorio.';
    if (!form.profesion.trim()) nextErrors.profesion = 'La profesión es obligatoria.';
    if (!form.especialidad.trim()) nextErrors.especialidad = 'La especialidad es obligatoria.';
    if (!form.materia_id) nextErrors.materia_id = 'Selecciona una materia habilitada.';

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    await onSubmit(buildDocenteFormData(form, !isDocenteMode && !isEditing));
  };

  const title = isDocenteMode
    ? 'Perfil docente'
    : isEditing
      ? 'Editar docente'
      : 'Nuevo docente';

  return (
    <div className="detail-modal-overlay docente-modal-overlay" onClick={onClose}>
      <div className="detail-modal docente-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>{title}</h3>
            <p>Completa los requisitos académicos y la materia habilitada del docente.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {backendError && <div className="message error">{backendError}</div>}

        <form className="docente-form-grid" onSubmit={handleSubmit}>
          {!isDocenteMode && (
            <label className="form-field full">
              Usuario docente *
              {isEditing ? (
                <input type="text" value={buildName(selectedUser || {})} disabled />
              ) : (
                <select
                  value={form.user_id}
                  onChange={(e) => handleChange('user_id', e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="">Seleccionar usuario con rol Docente</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {buildName(user)} - {user.email || user.correo || 'sin correo'}
                    </option>
                  ))}
                </select>
              )}
              {errors.user_id && <div className="field-error">{errors.user_id}</div>}
            </label>
          )}

          <label className="form-field">
            CI *
            <input value={form.ci} onChange={(e) => handleChange('ci', e.target.value)} placeholder="Ingrese CI" />
            {errors.ci && <div className="field-error">{errors.ci}</div>}
          </label>

          <label className="form-field">
            Teléfono *
            <input value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="Ingrese teléfono" />
            {errors.telefono && <div className="field-error">{errors.telefono}</div>}
          </label>

          <label className="form-field">
            Profesión *
            <input value={form.profesion} onChange={(e) => handleChange('profesion', e.target.value)} placeholder="Ej. Ingeniero Informático" />
            {errors.profesion && <div className="field-error">{errors.profesion}</div>}
          </label>

          <label className="form-field">
            Especialidad *
            <input value={form.especialidad} onChange={(e) => handleChange('especialidad', e.target.value)} placeholder="Ej. Programación" />
            {errors.especialidad && <div className="field-error">{errors.especialidad}</div>}
          </label>

          <label className="form-field full">
            Materia habilitada *
            <select value={form.materia_id} onChange={(e) => handleChange('materia_id', e.target.value)}>
              <option value="">Seleccionar materia activa</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {getMateriaNombre(materia)} {materia.codigo ? `(${materia.codigo})` : ''}
                </option>
              ))}
            </select>
            {!materias.length && (
              <div className="field-help">No hay materias activas disponibles. Verifica el módulo Materias del CUP.</div>
            )}
            {errors.materia_id && <div className="field-error">{errors.materia_id}</div>}
          </label>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={form.tiene_maestria}
              onChange={(e) => handleChange('tiene_maestria', e.target.checked)}
            />
            <span>Tiene maestría</span>
          </label>

          <label className="switch-field">
            <input
              type="checkbox"
              checked={form.tiene_diplomado}
              onChange={(e) => handleChange('tiene_diplomado', e.target.checked)}
            />
            <span>Tiene diplomado</span>
          </label>

          <label className="form-field full">
            Años de experiencia
            <input
              type="number"
              min="0"
              value={form.anios_experiencia}
              onChange={(e) => handleChange('anios_experiencia', e.target.value)}
              placeholder="0"
            />
          </label>

          <div className="file-grid full">
            {fileFields.map((field) => (
              <label className="file-field" key={field}>
                <UploadCloud size={18} />
                <span>{form[field]?.name || fieldLabels[field]}</span>
                <input type="file" onChange={(e) => handleChange(field, e.target.files?.[0] || null)} />
              </label>
            ))}
          </div>

          <div className="form-actions full">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
