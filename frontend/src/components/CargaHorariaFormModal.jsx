import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import * as service from '../services/cargaHorariaAulas';

const TURNOS = ['MAÑANA', 'TARDE', 'NOCHE'];
const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const emptyForm = {
  asignacion_docente_grupo_id: '',
  aula_id: '',
  turno: '',
  dia_semana: '',
  hora_inicio: '',
  hora_fin: '',
};

const normalizeList = (response) => {
  const payload = response?.data ?? response;
  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getGrupo = (asignacion) => asignacion?.grupo || asignacion?.grupo_cup || {};
const getMateria = (asignacion) => asignacion?.materia || {};
const getDocente = (asignacion) => asignacion?.docente || {};
const getUser = (docente) => docente?.user || docente?.usuario || {};
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || '';
const fullName = (docente) => docente?.nombre || docente?.nombre_completo || getUser(docente).nombre_completo || [docente?.nombres, docente?.apellidos].filter(Boolean).join(' ') || getUser(docente).name || '';
const asignacionLabel = (asignacion) => {
  const grupo = getGrupo(asignacion);
  return `${grupo.codigo || ''} - ${materiaNombre(getMateria(asignacion))} - ${fullName(getDocente(asignacion))}`;
};

export default function CargaHorariaFormModal({ open, carga, saving = false, backendError = '', onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [asignacionesDisponibles, setAsignacionesDisponibles] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [errors, setErrors] = useState({});
  const [localError, setLocalError] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingAulas, setLoadingAulas] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      asignacion_docente_grupo_id: carga?.asignacion_docente_grupo_id || carga?.asignacion?.id || '',
      aula_id: carga?.aula_id || carga?.aula?.id || '',
      turno: carga?.turno || '',
      dia_semana: carga?.dia_semana || '',
      hora_inicio: String(carga?.hora_inicio || '').slice(0, 5),
      hora_fin: String(carga?.hora_fin || '').slice(0, 5),
    });
    setErrors({});
    setLocalError('');
    setLoadingOptions(true);

    Promise.all([
      service.getAsignacionesDisponibles(),
      service.getAulas({ estado: 'ACTIVA' }),
    ])
      .then(([asignacionesResponse, aulasResponse]) => {
        const asignacionesList = normalizeList(asignacionesResponse);
        const aulasList = normalizeList(aulasResponse).filter((aula) => String(aula.estado).toUpperCase() === 'ACTIVA');
        const nextAsignaciones = carga?.asignacion
          ? [carga.asignacion, ...asignacionesList.filter((item) => item.id !== carga.asignacion.id)]
          : asignacionesList;
        const nextAulas = carga?.aula
          ? [carga.aula, ...aulasList.filter((item) => item.id !== carga.aula.id)]
          : aulasList;

        setAsignacionesDisponibles(nextAsignaciones);
        setAulas(nextAulas);
      })
      .catch((error) => setLocalError(getBackendError(error, 'No se pudieron cargar asignaciones o aulas.')))
      .finally(() => setLoadingOptions(false));
  }, [carga, open]);

  useEffect(() => {
    if (!open || !form.dia_semana || !form.hora_inicio || !form.hora_fin || form.hora_fin <= form.hora_inicio) return;

    setLoadingAulas(true);
    service.getAulasDisponibles({
      dia_semana: form.dia_semana,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
    })
      .then((response) => {
        const list = normalizeList(response).filter((aula) => String(aula.estado).toUpperCase() === 'ACTIVA');
        const nextAulas = carga?.aula ? [carga.aula, ...list.filter((item) => item.id !== carga.aula.id)] : list;
        setAulas(nextAulas);
      })
      .catch(() => {
        service.getAulas({ estado: 'ACTIVA' }).then((response) => {
          const nextAulas = normalizeList(response).filter((aula) => String(aula.estado).toUpperCase() === 'ACTIVA');
          setAulas(nextAulas);
        });
      })
      .finally(() => setLoadingAulas(false));
  }, [carga, form.dia_semana, form.hora_fin, form.hora_inicio, open]);

  const selectedAulaStillVisible = useMemo(
    () => !form.aula_id || aulas.some((aula) => String(aula.id) === String(form.aula_id)),
    [aulas, form.aula_id]
  );

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.asignacion_docente_grupo_id) nextErrors.asignacion_docente_grupo_id = 'Selecciona una asignacion docente-grupo.';
    if (!form.aula_id) nextErrors.aula_id = 'Selecciona un aula activa.';
    if (!form.turno) nextErrors.turno = 'Selecciona un turno.';
    if (!form.dia_semana) nextErrors.dia_semana = 'Selecciona un dia.';
    if (!form.hora_inicio) nextErrors.hora_inicio = 'Ingresa la hora de inicio.';
    if (!form.hora_fin) nextErrors.hora_fin = 'Ingresa la hora de fin.';
    if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
      nextErrors.hora_fin = 'La hora de fin debe ser mayor que la hora de inicio.';
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
      asignacion_docente_grupo_id: Number(form.asignacion_docente_grupo_id),
      aula_id: Number(form.aula_id),
      turno: form.turno,
      dia_semana: form.dia_semana,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
    });
  };

  return (
    <div className="cu12-modal-overlay" onClick={onClose}>
      <div className="cu12-modal cu12-wide-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>{carga ? 'Editar carga horaria' : 'Nueva carga horaria'}</h3>
            <p>Programa aula, turno y horario sobre una asignacion docente-grupo activa.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {(backendError || localError) && <div className="message error">{backendError || localError}</div>}

        <form className="cu12-form-grid" onSubmit={handleSubmit}>
          <label className="form-field full">
            Asignacion docente-grupo *
            <select value={form.asignacion_docente_grupo_id} onChange={(event) => handleChange('asignacion_docente_grupo_id', event.target.value)} disabled={loadingOptions}>
              <option value="">Seleccionar asignacion</option>
              {asignacionesDisponibles.map((asignacion) => (
                <option key={asignacion.id} value={asignacion.id}>{asignacionLabel(asignacion)}</option>
              ))}
            </select>
            {errors.asignacion_docente_grupo_id && <div className="field-error">{errors.asignacion_docente_grupo_id}</div>}
          </label>

          <label className="form-field">
            Dia *
            <select value={form.dia_semana} onChange={(event) => handleChange('dia_semana', event.target.value)}>
              <option value="">Seleccionar dia</option>
              {DIAS.map((dia) => <option key={dia} value={dia}>{dia}</option>)}
            </select>
            {errors.dia_semana && <div className="field-error">{errors.dia_semana}</div>}
          </label>

          <label className="form-field">
            Turno *
            <select value={form.turno} onChange={(event) => handleChange('turno', event.target.value)}>
              <option value="">Seleccionar turno</option>
              {TURNOS.map((turno) => <option key={turno} value={turno}>{turno}</option>)}
            </select>
            {errors.turno && <div className="field-error">{errors.turno}</div>}
          </label>

          <label className="form-field">
            Hora inicio *
            <input type="time" value={form.hora_inicio} onChange={(event) => handleChange('hora_inicio', event.target.value)} />
            {errors.hora_inicio && <div className="field-error">{errors.hora_inicio}</div>}
          </label>

          <label className="form-field">
            Hora fin *
            <input type="time" value={form.hora_fin} onChange={(event) => handleChange('hora_fin', event.target.value)} />
            {errors.hora_fin && <div className="field-error">{errors.hora_fin}</div>}
          </label>

          <label className="form-field full">
            Aula activa *
            <select value={form.aula_id} onChange={(event) => handleChange('aula_id', event.target.value)} disabled={loadingOptions || loadingAulas}>
              <option value="">{loadingAulas ? 'Buscando aulas disponibles...' : 'Seleccionar aula'}</option>
              {aulas.map((aula) => (
                <option key={aula.id} value={aula.id}>{aula.codigo || 'SIN-CODIGO'} - {aula.nombre || 'Aula'} ({aula.capacidad ?? 0})</option>
              ))}
            </select>
            {!selectedAulaStillVisible && <div className="field-help">El aula seleccionada no aparece como disponible para este horario.</div>}
            {errors.aula_id && <div className="field-error">{errors.aula_id}</div>}
          </label>

          <div className="form-actions full">
            <button className="btn-secondary" type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn-primary" type="submit" disabled={saving || loadingOptions}>{saving ? 'Guardando...' : 'Guardar carga horaria'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
