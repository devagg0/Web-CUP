import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import * as asignacionService from '../services/asignacionDocentes';
import * as gruposCupService from '../services/gruposCup';
import * as materiasService from '../services/materias';

const emptyForm = {
  grupo_id: '',
  materia_id: '',
  docente_id: '',
};

const extractList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.grupos)) return payload.grupos;
  if (Array.isArray(payload?.grupos_cup)) return payload.grupos_cup;
  if (Array.isArray(payload?.materias)) return payload.materias;
  if (Array.isArray(payload?.docentes)) return payload.docentes;
  return [];
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || `Materia ${materia?.id}`;

const getUser = (docente) => docente?.user || docente?.usuario || {};

const fullName = (docente) => {
  const user = getUser(docente);
  return docente?.nombre_completo
    || user.nombre_completo
    || [docente?.nombre, docente?.nombres, docente?.apellidos].filter(Boolean).join(' ')
    || [user.name, user.nombres, user.apellidos].filter(Boolean).join(' ')
    || user.email
    || 'Docente';
};

const getCorreo = (docente) => docente?.correo || docente?.email || getUser(docente).email || getUser(docente).correo || 'sin correo';

const getGruposCount = (docente) => docente?.grupos_asignados_count ?? docente?.grupos_asignados ?? docente?.total_grupos_asignados ?? 0;

export default function AsignacionDocenteFormModal({
  open,
  saving = false,
  backendError = '',
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;

    setForm(emptyForm);
    setErrors({});
    setDocentes([]);
    setLocalError('');
    setLoadingOptions(true);

    Promise.all([
      gruposCupService.getGruposCup(),
      materiasService.getMateriasActivas(),
    ])
      .then(([gruposResponse, materiasResponse]) => {
        setGrupos(extractList(gruposResponse));
        setMaterias(extractList(materiasResponse));
      })
      .catch((error) => {
        setLocalError(getBackendError(error, 'No se pudieron cargar grupos o materias.'));
      })
      .finally(() => setLoadingOptions(false));
  }, [open]);

  useEffect(() => {
    if (!open || !form.materia_id) {
      setDocentes([]);
      return;
    }

    setForm((prev) => ({ ...prev, docente_id: '' }));
    setLoadingDocentes(true);
    setLocalError('');

    const params = {
      materia_id: form.materia_id,
      ...(form.grupo_id ? { grupo_id: form.grupo_id } : {}),
    };

    asignacionService.getDocentesDisponibles(params)
      .then((response) => setDocentes(extractList(response)))
      .catch((error) => {
        setDocentes([]);
        setLocalError(getBackendError(error, 'No se pudieron cargar los docentes disponibles.'));
      })
      .finally(() => setLoadingDocentes(false));
  }, [form.grupo_id, form.materia_id, open]);

  const selectedGrupo = useMemo(
    () => grupos.find((grupo) => String(grupo.id) === String(form.grupo_id)),
    [form.grupo_id, grupos]
  );

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.grupo_id) nextErrors.grupo_id = 'Selecciona un grupo CUP.';
    if (!form.materia_id) nextErrors.materia_id = 'Selecciona una materia.';
    if (!form.docente_id) nextErrors.docente_id = 'Selecciona un docente disponible.';
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
      grupo_id: Number(form.grupo_id),
      materia_id: Number(form.materia_id),
      docente_id: Number(form.docente_id),
    });
  };

  return (
    <div className="detail-modal-overlay asignacion-modal-overlay" onClick={onClose}>
      <div className="detail-modal asignacion-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Nueva asignacion</h3>
            <p>Selecciona grupo, materia y docente habilitado disponible.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {(backendError || localError) && <div className="message error">{backendError || localError}</div>}

        <form className="asignacion-form-grid" onSubmit={handleSubmit}>
          <label className="form-field full">
            Grupo CUP *
            <select
              value={form.grupo_id}
              onChange={(event) => handleChange('grupo_id', event.target.value)}
              disabled={loadingOptions}
            >
              <option value="">Seleccionar grupo CUP</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.codigo || 'SIN-CODIGO'} - {grupo.nombre || 'Grupo'} ({grupo.cantidad_estudiantes ?? grupo.estudiantes_count ?? 0} estudiantes)
                </option>
              ))}
            </select>
            {selectedGrupo?.estado && String(selectedGrupo.estado).toUpperCase() !== 'HABILITADO' && (
              <div className="field-help">Este grupo no figura como HABILITADO.</div>
            )}
            {errors.grupo_id && <div className="field-error">{errors.grupo_id}</div>}
          </label>

          <label className="form-field full">
            Materia *
            <select
              value={form.materia_id}
              onChange={(event) => handleChange('materia_id', event.target.value)}
              disabled={loadingOptions || !form.grupo_id}
            >
              <option value="">{form.grupo_id ? 'Seleccionar materia' : 'Selecciona primero un grupo'}</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {getMateriaNombre(materia)}
                </option>
              ))}
            </select>
            {!materias.length && !loadingOptions && <div className="field-help">No hay materias activas disponibles.</div>}
            {errors.materia_id && <div className="field-error">{errors.materia_id}</div>}
          </label>

          <label className="form-field full">
            Docente disponible *
            <select
              value={form.docente_id}
              onChange={(event) => handleChange('docente_id', event.target.value)}
              disabled={!form.grupo_id || !form.materia_id || loadingDocentes}
            >
              <option value="">
                {loadingDocentes
                  ? 'Cargando docentes disponibles...'
                  : form.materia_id
                    ? 'Seleccionar docente disponible'
                    : 'Selecciona primero una materia'}
              </option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {fullName(docente)} - {getCorreo(docente)} - {getGruposCount(docente)}/4 grupos
                </option>
              ))}
            </select>
            {form.materia_id && !loadingDocentes && docentes.length === 0 && (
              <div className="field-help">No existen docentes habilitados disponibles para esta materia.</div>
            )}
            {errors.docente_id && <div className="field-error">{errors.docente_id}</div>}
          </label>

          <div className="form-actions full">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="btn-primary" type="submit" disabled={saving || loadingOptions || loadingDocentes}>
              {saving ? 'Asignando...' : 'Asignar docente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
