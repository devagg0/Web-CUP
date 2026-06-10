import { AlertTriangle, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as preinscripcionService from '../services/preinscripcion';
import * as gruposCupService from '../services/gruposCup';
import * as asignacionService from '../services/asignacionDocentes';
import * as docentesService from '../services/docentes';
import * as examenesService from '../services/examenesCup';

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

const getDocenteLabel = (docente) => {
  if (!docente) return 'Docente no asignado';
  return (
    docente.nombre ??
    docente.nombre_usuario ??
    docente.nombre_completo ??
    docente.user?.name ??
    docente.user?.nombre ??
    docente.correo_usuario ??
    docente.correo ??
    `Docente ${docente.id ?? ''}`
  );
};

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
  
  const [userRole, setUserRole] = useState('');
  const [filteredPostulantes, setFilteredPostulantes] = useState([]);
  const [selectedPostulante, setSelectedPostulante] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [localGrupos, setLocalGrupos] = useState([]);
  const [localMaterias, setLocalMaterias] = useState([]);
  const [localDocentes, setLocalDocentes] = useState([]);
  const [currentDocenteId, setCurrentDocenteId] = useState('');

  const isEdit = Boolean(nota?.id);
  const final = useMemo(() => calculateFinal(form), [form]);
  const estado = useMemo(() => estimateEstado(form), [form]);
  const hasLowPartial = [form.parcial_1, form.parcial_2, form.parcial_3]
    .map(toNumber)
    .some((value) => value != null && value < 60);

  useEffect(() => {
    if (open) {
      // 1. Get role from session
      let role = '';
      try {
        const stored = sessionStorage.getItem('user');
        const userObj = stored ? JSON.parse(stored) : null;
        role = userObj?.role?.toLowerCase() || '';
        setUserRole(role);
      } catch (e) {
        console.error('Error reading role', e);
      }

      // 2. Initialize form
      if (isEdit) {
        setForm(normalizeEditForm(nota));
        // If editing, we display selected postulante info card
        if (nota?.postulante) {
          setSelectedPostulante({
            id: nota.postulante.id || nota.postulante_id,
            ci: nota.postulante.ci || nota.postulante_ci || nota.ci,
            nombre_completo: nota.postulante.nombre_completo || nota.postulante_nombre || [nota.postulante.nombres, nota.postulante.apellidos].filter(Boolean).join(' '),
            correo: nota.postulante.correo || nota.postulante_correo || nota.correo,
            estado_preinscripcion: 'INSCRITO'
          });
        } else {
          setSelectedPostulante({
            id: nota?.postulante_id,
            ci: nota?.ci || nota?.postulante_ci,
            nombre_completo: nota?.postulante_nombre || 'Postulante',
            correo: nota?.correo || '',
            estado_preinscripcion: 'INSCRITO'
          });
        }
        setSearchText('');
      } else {
        setForm(initialForm);
        setSelectedPostulante(null);
        setSearchText('');
      }
      setLocalError('');
      setFilteredPostulantes([]);
      setShowDropdown(false);

      // 3. Load catalogs and settings depending on role
      const setupRoleData = async (roleVal) => {
        if (roleVal === 'docente') {
          try {
            // Fetch docente profile
            const profileRes = await docentesService.obtenerMiPerfilDocente();
            const profile = profileRes.data || profileRes;
            const currentDocente = profile.docente || profile;
            const docId = currentDocente?.id;
            
            if (docId) {
              setCurrentDocenteId(docId);
              setForm(prev => ({ ...prev, docente_id: String(docId) }));
            }
            if (currentDocente) {
              setLocalDocentes([currentDocente]);
            }

            // Fetch assignments
            const assignmentsRes = await asignacionService.getMisGruposAsignadosDocente();
            const list = examenesService.normalizeList(assignmentsRes);

            const extractedGroups = [];
            const extractedMaterias = [];
            const groupIds = new Set();
            const materiaIds = new Set();

            list.forEach(item => {
              if (item.grupo && !groupIds.has(item.grupo.id)) {
                groupIds.add(item.grupo.id);
                extractedGroups.push(item.grupo);
              }
              if (item.materia && !materiaIds.has(item.materia.id)) {
                materiaIds.add(item.materia.id);
                extractedMaterias.push(item.materia);
              }
            });

            setLocalGrupos(extractedGroups);
            setLocalMaterias(extractedMaterias);

            if (extractedGroups.length === 1 && !isEdit) {
              setForm(prev => ({ ...prev, grupo_id: String(extractedGroups[0].id) }));
            }
            if (extractedMaterias.length === 1 && !isEdit) {
              setForm(prev => ({ ...prev, materia_id: String(extractedMaterias[0].id) }));
            }

          } catch (err) {
            console.error('Error setting up docente data inside modal:', err);
          }
        } else {
          // Admin, Coordinador, Autoridad
          setLocalGrupos(grupos);
          setLocalMaterias(materias);
          setLocalDocentes(docentes);
        }
      };

      setupRoleData(role);
    }
  }, [open, isEdit, nota, grupos, materias, docentes]);

  // Hook to watch group selection and clear search / selection
  useEffect(() => {
    if (!open || isEdit) return;

    setSelectedPostulante(null);
    setForm(prev => ({ ...prev, postulante_id: '' }));
    setSearchText('');
    setFilteredPostulantes([]);
  }, [form.grupo_id, open, isEdit]);

  // Hook to dynamically fetch active docentes for Admin/Coordinador
  useEffect(() => {
    if (!open || isEdit || userRole === 'docente') return;

    const groupId = form.grupo_id;
    const materiaId = form.materia_id;

    if (!groupId || !materiaId) {
      setLocalDocentes([]);
      setForm(prev => ({ ...prev, docente_id: '' }));
      return;
    }

    const fetchAssignedDocentes = async () => {
      try {
        const res = await asignacionService.getAsignacionesDocentes({
          grupo_id: groupId,
          materia_id: materiaId,
          estado: 'ACTIVA'
        });
        const list = examenesService.normalizeList(res);
        const activeDocentes = list.map(item => item.docente).filter(Boolean);
        setLocalDocentes(activeDocentes);

        if (activeDocentes.length === 1) {
          setForm(prev => ({ ...prev, docente_id: String(activeDocentes[0].id) }));
        } else {
          setForm(prev => ({ ...prev, docente_id: '' }));
        }
      } catch (err) {
        console.error('Error fetching assigned docentes:', err);
        setLocalDocentes([]);
        setForm(prev => ({ ...prev, docente_id: '' }));
      }
    };

    fetchAssignedDocentes();
  }, [form.grupo_id, form.materia_id, open, isEdit, userRole]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchText(value);
    
    if (!value.trim()) {
      setFilteredPostulantes([]);
      setShowDropdown(false);
      return;
    }

    if (!form.grupo_id) {
      setFilteredPostulantes([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await examenesService.getPostulantesDisponibles({
        search: value,
        grupo_id: form.grupo_id,
        materia_id: form.materia_id || undefined,
      });
      const list = examenesService.normalizeList(res);
      setFilteredPostulantes(list);
      setShowDropdown(true);
    } catch (err) {
      console.error('Error fetching dynamic search results:', err);
      setFilteredPostulantes([]);
    }
  };

  const handleSelectPostulante = (student) => {
    setSelectedPostulante(student);
    setForm(prev => ({ ...prev, postulante_id: String(student.id) }));
    setSearchText('');
    setShowDropdown(false);
  };

  const handleRemoveSelection = () => {
    setSelectedPostulante(null);
    setForm(prev => ({ ...prev, postulante_id: '' }));
    setSearchText('');
  };

  const validate = () => {
    if (!form.grupo_id) {
      return 'Selecciona un grupo.';
    }
    if (!form.materia_id) {
      return 'Selecciona una materia.';
    }
    if (!form.docente_id) {
      return 'Selecciona un docente.';
    }
    if (!form.postulante_id) {
      return 'Selecciona un postulante de la lista antes de guardar.';
    }

    const required = ['parcial_1', 'parcial_2', 'parcial_3'];
    if (required.some((field) => form[field] === '' || form[field] == null)) {
      return 'Todos los campos son obligatorios.';
    }

    const scores = [form.parcial_1, form.parcial_2, form.parcial_3].map(Number);
    if (scores.some((value) => Number.isNaN(value))) {
      return 'Las notas deben ser numericas.';
    }
    if (scores.some((value) => value < 0 || value > 100)) {
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
          {isEdit ? (
            <div className="detail-info-card wide" style={{ gridColumn: 'span 2' }}>
              <span>Postulante</span>
              <strong>
                {selectedPostulante 
                  ? `${selectedPostulante.ci} - ${selectedPostulante.nombre_completo}`
                  : `ID: ${form.postulante_id}`}
              </strong>
            </div>
          ) : (
            <>
              <div className="search-postulante-container" style={{ gridColumn: 'span 2' }}>
                <span>Buscar postulante</span>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder={form.grupo_id ? "Buscar por CI, nombre o correo" : "Selecciona un grupo para buscar postulantes."}
                    value={searchText}
                    onChange={handleSearchChange}
                    onFocus={() => {
                      if (form.grupo_id && searchText) {
                        setShowDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowDropdown(false), 200);
                    }}
                    disabled={!form.grupo_id}
                  />
                  {searchText && (
                    <button className="search-clear-btn" type="button" onClick={() => { setSearchText(''); setFilteredPostulantes([]); }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {!form.grupo_id && (
                  <p className="search-help-text" style={{ color: '#c2410c', marginTop: '4px', fontSize: '0.875rem' }}>
                    Selecciona un grupo para buscar postulantes.
                  </p>
                )}

                {showDropdown && searchText && (
                  <div className="search-results-dropdown">
                    {filteredPostulantes.length > 0 ? (
                      filteredPostulantes.map((student) => (
                        <div
                          key={student.id}
                          className="search-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectPostulante(student);
                          }}
                        >
                          {student.nombre_completo || `${student.nombres} ${student.apellidos}`} (CI: {student.ci} - {student.correo})
                        </div>
                      ))
                    ) : (
                      <div className="search-no-results">
                        No se encontraron postulantes inscritos para este grupo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedPostulante && (
                <div className="selected-student-card" style={{ gridColumn: 'span 2' }}>
                  <div className="selected-student-info">
                    <div className="student-name">{selectedPostulante.nombre_completo || `${selectedPostulante.nombres} ${selectedPostulante.apellidos}`}</div>
                    <div className="student-meta">
                      CI: {selectedPostulante.ci} | Correo: {selectedPostulante.correo} | Grupo: {selectedPostulante.grupo?.codigo || selectedPostulante.grupo?.nombre || 'Ninguno'}
                    </div>
                  </div>
                  <div className="selected-student-actions">
                    <span className="badge-inscrito">{selectedPostulante.estado || selectedPostulante.estado_preinscripcion || 'INSCRITO'}</span>
                    <button
                      className="btn-remove-selection"
                      type="button"
                      onClick={handleRemoveSelection}
                      title="Quitar selección"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <label>
            <span>Grupo</span>
            <select name="grupo_id" value={form.grupo_id} onChange={handleChange} disabled={isEdit}>
              <option value="">Seleccionar grupo</option>
              {localGrupos.map((grupo) => (
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
              {localMaterias.map((materia) => (
                <option key={getId(materia)} value={getId(materia)}>{getLabel(materia, `Materia ${getId(materia)}`)}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Docente</span>
            <select name="docente_id" value={form.docente_id} onChange={handleChange} disabled={isEdit || userRole === 'docente'}>
              <option value="">
                {userRole === 'docente' 
                  ? 'Docente logueado' 
                  : !form.grupo_id || !form.materia_id 
                    ? 'Seleccionar grupo y materia primero' 
                    : 'Seleccionar docente'}
              </option>
              {localDocentes.map((docente) => (
                <option key={getId(docente)} value={getId(docente)}>
                  {getDocenteLabel(docente)}
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
