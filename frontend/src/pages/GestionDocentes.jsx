import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import DocentesTable from '../components/DocentesTable';
import DocenteFormModal from '../components/DocenteFormModal';
import DocenteDetailModal from '../components/DocenteDetailModal';
import DocenteActionModal from '../components/DocenteActionModal';
import * as docentesService from '../services/docentes';
import * as materiasService from '../services/materias';
import '../styles/docentes.css';

const ESTADOS = [
  ['PERFIL_PENDIENTE', 'Perfil pendiente'],
  ['EN_REVISION', 'En revisión'],
  ['OBSERVADO', 'Observado'],
  ['HABILITADO', 'Habilitado'],
  ['RECHAZADO', 'Rechazado'],
  ['INACTIVO', 'Inactivo'],
];

const manageRoles = ['admin', 'administrador', 'coordinador'];

const extractList = (response) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.docentes)) return payload.docentes;
  if (Array.isArray(payload?.materias)) return payload.materias;
  return [];
};

const extractOne = (response) => response?.data?.docente || response?.data || response?.docente || response;

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || `Materia ${materia?.id}`;

const getDocenteUser = (docente) => docente?.user || docente?.usuario || {};

const getDocenteMateriaId = (docente) => docente?.materia_id || docente?.materia?.id || docente?.materia_habilitada?.id || '';

const getCleanParams = (currentFilters) => {
  const cleanParams = {};
  const search = currentFilters.search?.trim();

  if (search) cleanParams.search = search;
  if (currentFilters.estado_docente) cleanParams.estado_docente = currentFilters.estado_docente;
  if (currentFilters.materia_id) cleanParams.materia_id = currentFilters.materia_id;

  return cleanParams;
};

const filterDocentesLocally = (list, cleanParams) => {
  if (!Object.keys(cleanParams).length) return list;

  return list.filter((docente) => {
    const user = getDocenteUser(docente);
    const query = cleanParams.search?.toLowerCase();
    const searchableText = [
      user.name,
      user.nombres,
      user.apellidos,
      user.email,
      user.correo,
      docente.correo,
      docente.ci,
      docente.especialidad,
      docente.profesion,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);
    const matchesEstado = !cleanParams.estado_docente || docente.estado_docente === cleanParams.estado_docente;
    const matchesMateria = !cleanParams.materia_id || String(getDocenteMateriaId(docente)) === String(cleanParams.materia_id);

    return matchesSearch && matchesEstado && matchesMateria;
  });
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  return data?.message || data?.error || fallback;
};

const getRole = () => {
  try {
    const stored = sessionStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    return user?.role?.toLowerCase() || '';
  } catch (e) {
    return '';
  }
};

export default function GestionDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filters, setFilters] = useState({ search: '', estado_docente: '', materia_id: '' });
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: '', docente: null });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const role = getRole();
  const canManage = manageRoles.includes(role);

  const loadDocentes = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const cleanParams = getCleanParams(nextFilters);
      console.log('Filtros docentes enviados:', cleanParams);
      const response = await docentesService.listarDocentes(cleanParams);
      console.log('Respuesta docentes:', response);
      setDocentes(filterDocentesLocally(extractList(response), cleanParams));
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar los docentes.'));
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const [materiasResponse, usuariosResponse] = await Promise.all([
        materiasService.getMateriasActivas(),
        canManage ? docentesService.obtenerUsuariosDocentesDisponibles() : Promise.resolve([]),
      ]);
      const materiasArray = extractList(materiasResponse);
      console.log('Materias activas normalizadas:', materiasArray);
      setMaterias(materiasArray);
      setUsuarios(extractList(usuariosResponse));
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar los datos de apoyo.'));
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadDocentes();
    loadOptions();
  }, []);

  const summary = useMemo(() => {
    const base = {
      total: docentes.length,
      PERFIL_PENDIENTE: 0,
      EN_REVISION: 0,
      OBSERVADO: 0,
      HABILITADO: 0,
      RECHAZADO: 0,
    };
    docentes.forEach((docente) => {
      if (base[docente.estado_docente] !== undefined) {
        base[docente.estado_docente] += 1;
      }
    });
    return base;
  }, [docentes]);

  const clearFilters = () => {
    const emptyFilters = { search: '', estado_docente: '', materia_id: '' };
    setFilters(emptyFilters);
    loadDocentes(emptyFilters);
  };

  const refresh = () => {
    loadDocentes(filters);
    loadOptions();
  };

  const handleNew = () => {
    setEditing(null);
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    setFormError('');
    try {
      if (editing?.id) {
        await docentesService.actualizarDocente(editing.id, formData);
        setMessage('Docente actualizado correctamente.');
      } else {
        await docentesService.crearDocente(formData);
        setMessage('Docente creado correctamente.');
      }
      setFormOpen(false);
      setEditing(null);
      refresh();
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo guardar el perfil docente.'));
    } finally {
      setSaving(false);
    }
  };

  const loadDetail = async (docente) => {
    try {
      const response = await docentesService.obtenerDocente(docente.id);
      setDetail(extractOne(response));
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar el detalle del docente.'));
    }
  };

  const handleAction = async (action, docente) => {
    setMessage('');
    setError('');

    if (action === 'view') {
      loadDetail(docente);
      return;
    }

    if (!canManage) return;

    if (action === 'edit') {
      setEditing(docente);
      setFormError('');
      setFormOpen(true);
      return;
    }

    if (action === 'observe' || action === 'reject') {
      setActionError('');
      setActionModal({ open: true, type: action, docente });
      return;
    }

    const messages = {
      send: '¿Enviar este perfil docente a revisión?',
      approve: '¿Aprobar y habilitar este docente?',
      inactive: '¿Inactivar este docente?',
    };
    if (!window.confirm(messages[action])) return;

    try {
      if (action === 'send') await docentesService.enviarRevisionDocente(docente.id);
      if (action === 'approve') await docentesService.aprobarDocente(docente.id);
      if (action === 'inactive') await docentesService.inactivarDocente(docente.id);
      setMessage('Acción realizada correctamente.');
      loadDocentes(filters);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo completar la acción.'));
    }
  };

  const confirmObservation = async (observacion) => {
    setSaving(true);
    setActionError('');
    try {
      if (actionModal.type === 'observe') {
        await docentesService.observarDocente(actionModal.docente.id, observacion);
        setMessage('Docente observado correctamente.');
      } else {
        await docentesService.rechazarDocente(actionModal.docente.id, observacion);
        setMessage('Docente rechazado correctamente.');
      }
      setActionModal({ open: false, type: '', docente: null });
      loadDocentes(filters);
    } catch (e) {
      setActionError(getBackendError(e, 'No se pudo completar la acción.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell docentes-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Docentes" breadcrumb="Sistema de Admisión CUP / Docentes" />

        <div className="content-inner">
          <div className="docentes-heading">
            <p>Administra perfiles académicos, requisitos y habilitación de docentes para el CUP.</p>
          </div>

          <div className="stats-row docentes-stats">
            <StatCard title="Total docentes" value={summary.total} accent="#003B73" />
            <StatCard title="Perfil pendiente" value={summary.PERFIL_PENDIENTE} accent="#6B7280" />
            <StatCard title="En revisión" value={summary.EN_REVISION} accent="#0056B3" />
            <StatCard title="Habilitados" value={summary.HABILITADO} accent="#16A34A" />
            <StatCard title="Observados" value={summary.OBSERVADO} accent="#F97316" />
            <StatCard title="Rechazados" value={summary.RECHAZADO} accent="#DC2626" />
          </div>

          <div className="controls-row docentes-controls">
            <div className="filters docentes-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo, CI o especialidad"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadDocentes(filters);
                    }
                  }}
                />
              </label>
              <select
                value={filters.estado_docente}
                onChange={(e) => {
                  const nextFilters = { ...filters, estado_docente: e.target.value };
                  setFilters(nextFilters);
                  loadDocentes(nextFilters);
                }}
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <select
                value={filters.materia_id}
                onChange={(e) => {
                  const nextFilters = { ...filters, materia_id: e.target.value };
                  setFilters(nextFilters);
                  loadDocentes(nextFilters);
                }}
              >
                <option value="">Todas las materias</option>
                {materias.map((materia) => <option key={materia.id} value={materia.id}>{getMateriaNombre(materia)}</option>)}
              </select>
              <button className="btn-ghost" type="button" onClick={clearFilters}>Limpiar filtros</button>
              <button className="btn-secondary btn-inline" type="button" onClick={() => loadDocentes(filters)}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>
            {canManage && (
              <button className="btn-primary btn-new" type="button" onClick={handleNew}>
                <Plus size={16} /> Nuevo docente
              </button>
            )}
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando docentes...</div>
            ) : (
              <DocentesTable docentes={docentes} canManage={canManage} onAction={handleAction} />
            )}
          </div>
        </div>

        <DocenteFormModal
          open={formOpen}
          docente={editing}
          usuarios={usuarios}
          materias={materias}
          loadingOptions={loadingOptions}
          saving={saving}
          backendError={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSave}
        />
        <DocenteDetailModal docente={detail} onClose={() => setDetail(null)} />
        <DocenteActionModal
          open={actionModal.open}
          type={actionModal.type}
          docente={actionModal.docente}
          loading={saving}
          error={actionError}
          onClose={() => setActionModal({ open: false, type: '', docente: null })}
          onConfirm={confirmObservation}
        />
      </main>
    </div>
  );
}
