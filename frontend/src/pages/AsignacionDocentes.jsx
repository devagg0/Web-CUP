import { useEffect, useMemo, useState } from 'react';
import { Ban, Eye, PlayCircle, Plus, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EstadoAsignacionBadge from '../components/EstadoAsignacionBadge';
import AsignacionDocenteFormModal from '../components/AsignacionDocenteFormModal';
import AsignacionDocenteDetailModal from '../components/AsignacionDocenteDetailModal';
import * as asignacionService from '../services/asignacionDocentes';
import * as gruposCupService from '../services/gruposCup';
import * as materiasService from '../services/materias';
import '../styles/asignacionDocentes.css';

const manageRoles = ['admin', 'administrador', 'coordinador'];

const emptyResumen = {
  total_grupos: 0,
  docentes_habilitados: 0,
  asignaciones_activas: 0,
  grupos_con_docentes: 0,
};

const extractPayload = (response) => response?.data || response || {};

const normalizeList = (response) => {
  const payload = response?.data ?? response;

  return Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.asignaciones)
        ? payload.asignaciones
        : Array.isArray(payload?.asignaciones_docentes)
          ? payload.asignaciones_docentes
          : Array.isArray(payload?.grupos)
            ? payload.grupos
            : Array.isArray(payload?.grupos_cup)
              ? payload.grupos_cup
              : Array.isArray(payload?.materias)
                ? payload.materias
                : [];
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

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const cleanParams = (filters) => {
  const params = {};
  if (filters.grupo_id) params.grupo_id = filters.grupo_id;
  if (filters.materia_id) params.materia_id = filters.materia_id;
  if (filters.docente_id) params.docente_id = filters.docente_id;
  if (filters.estado) params.estado = filters.estado;
  return params;
};

const getGrupo = (asignacion) => asignacion?.grupo || asignacion?.grupo_cup || asignacion?.grupoCup || {};

const getMateria = (asignacion) => asignacion?.materia || {};

const getDocente = (asignacion) =>
  asignacion?.docente
  || asignacion?.docente_perfil
  || asignacion?.asignacion?.docente
  || asignacion?.asignacion_docente?.docente
  || {};

const getUser = (docente) => docente?.user || docente?.usuario || {};

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || `Materia ${materia?.id}`;

const fullName = (docente) => {
  const user = getUser(docente);
  return docente?.nombre_completo
    || user.nombre_completo
    || [docente?.nombre, docente?.nombres, docente?.apellidos].filter(Boolean).join(' ')
    || [user.name, user.nombres, user.apellidos].filter(Boolean).join(' ')
    || user.email
    || 'Docente';
};

const getCorreo = (docente) => docente?.correo || docente?.email || getUser(docente).email || getUser(docente).correo || 'Sin correo';

const getGruposCount = (asignacion) => {
  const docente = getDocente(asignacion);
  return asignacion.grupos_asignados_docente
    ?? asignacion.grupos_asignados
    ?? asignacion.asignaciones_activas_docente
    ?? asignacion.total_grupos_asignados
    ?? asignacion.grupos_asignados_actuales
    ?? asignacion.asignaciones_grupo_count
    ?? asignacion.asignaciones_activas_count
    ?? docente?.grupos_asignados
    ?? docente?.grupos_asignados_docente
    ?? docente?.asignaciones_activas
    ?? docente?.total_grupos_asignados
    ?? docente?.grupos_asignados_actuales
    ?? docente?.asignaciones_grupo_count
    ?? docente?.asignaciones_activas_count
    ?? docente?.asignaciones?.length
    ?? 0;
};

const getMaxGrupos = (asignacion) => {
  const docente = getDocente(asignacion);
  return asignacion.capacidad_grupos_maxima
    ?? asignacion.max_grupos
    ?? asignacion.maximo_grupos
    ?? docente?.capacidad_grupos_maxima
    ?? docente?.max_grupos
    ?? docente?.maximo_grupos
    ?? 4;
};

const formatDate = (value) => {
  if (!value) return 'No registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AsignacionDocentes() {
  const [resumen, setResumen] = useState(emptyResumen);
  const [asignaciones, setAsignaciones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filters, setFilters] = useState({ grupo_id: '', materia_id: '', docente_id: '', estado: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const role = getRole();
  const canManage = manageRoles.includes(role);

  const loadResumen = async () => {
    const response = await asignacionService.getResumenAsignacionesDocentes();
    setResumen({ ...emptyResumen, ...extractPayload(response) });
  };

  const loadAsignaciones = async (nextFilters = filters) => {
    const response = await asignacionService.getAsignacionesDocentes(cleanParams(nextFilters));
    const asignacionesArray = normalizeList(response);
    setAsignaciones(asignacionesArray);
  };

  const loadOptions = async () => {
    const [gruposResponse, materiasResponse] = await Promise.all([
      gruposCupService.getGruposCup(),
      materiasService.getMateriasActivas(),
    ]);
    setGrupos(normalizeList(gruposResponse));
    setMaterias(normalizeList(materiasResponse));
  };

  const loadData = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadResumen(),
        loadAsignaciones(nextFilters),
        loadOptions(),
      ]);
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar las asignaciones docentes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const docentesFiltro = useMemo(() => {
    const map = new Map();
    asignaciones.forEach((asignacion) => {
      const docente = getDocente(asignacion);
      if (docente?.id) map.set(docente.id, docente);
    });
    return Array.from(map.values());
  }, [asignaciones]);

  const handleFilterChange = (field, value) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    loadAsignaciones(nextFilters).catch((e) => {
      setError(getBackendError(e, 'No se pudieron aplicar los filtros.'));
    });
  };

  const clearFilters = () => {
    const empty = { grupo_id: '', materia_id: '', docente_id: '', estado: '' };
    setFilters(empty);
    loadAsignaciones(empty).catch((e) => {
      setError(getBackendError(e, 'No se pudieron limpiar los filtros.'));
    });
  };

  const refresh = () => {
    setMessage('');
    loadData(filters);
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    try {
      await asignacionService.crearAsignacionDocente(payload);
      setMessage('Docente asignado correctamente.');
      setFormOpen(false);
      await loadData(filters);
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo crear la asignación docente.'));
    } finally {
      setSaving(false);
    }
  };

  const loadDetail = async (asignacion) => {
    setError('');
    try {
      const response = await asignacionService.getAsignacionDocente(asignacion.id);
      const payload = extractPayload(response);
      setDetail({
        ...asignacion,
        ...(payload.asignacion || payload.asignacion_docente || payload),
      });
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar el detalle de la asignación.'));
    }
  };

  const changeEstado = async (asignacion, action) => {
    if (!canManage) return;

    const isReactivate = action === 'reactivar';
    const question = isReactivate
      ? '¿Deseas reactivar esta asignación docente? Se validarán nuevamente las reglas de asignación.'
      : '¿Deseas inactivar esta asignación docente?';

    if (!window.confirm(question)) return;

    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      if (isReactivate) {
        await asignacionService.reactivarAsignacionDocente(asignacion.id);
        setMessage('Asignación docente reactivada correctamente.');
      } else {
        await asignacionService.inactivarAsignacionDocente(asignacion.id);
        setMessage('Asignación docente inactivada correctamente.');
      }
      await loadData(filters);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo completar la acción.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="app-shell asignacion-docentes-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Asignación de docentes" breadcrumb="Sistema de Admisión CUP / Asignación de docentes" />

        <div className="content-inner">
          <div className="asignacion-heading">
            <p>Asigna docentes habilitados a grupos CUP según la materia correspondiente.</p>
          </div>

          <div className="stats-row asignacion-stats">
            <StatCard title="Total grupos" value={resumen.total_grupos ?? 0} accent="#003B73" />
            <StatCard title="Docentes habilitados" value={resumen.docentes_habilitados ?? 0} accent="#0056B3" />
            <StatCard title="Asignaciones activas" value={resumen.asignaciones_activas ?? 0} accent="#16A34A" />
            <StatCard title="Grupos con docentes" value={resumen.grupos_con_docentes ?? 0} accent="#0F766E" />
          </div>

          <div className="controls-row asignacion-controls">
            <div className="filters asignacion-filters">
              <select value={filters.grupo_id} onChange={(event) => handleFilterChange('grupo_id', event.target.value)}>
                <option value="">Todos los grupos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.codigo || 'SIN-CODIGO'} - {grupo.nombre || 'Grupo'}
                  </option>
                ))}
              </select>

              <select value={filters.materia_id} onChange={(event) => handleFilterChange('materia_id', event.target.value)}>
                <option value="">Todas las materias</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>{getMateriaNombre(materia)}</option>
                ))}
              </select>

              <select value={filters.docente_id} onChange={(event) => handleFilterChange('docente_id', event.target.value)}>
                <option value="">Todos los docentes</option>
                {docentesFiltro.map((docente) => (
                  <option key={docente.id} value={docente.id}>{fullName(docente)}</option>
                ))}
              </select>

              <select value={filters.estado} onChange={(event) => handleFilterChange('estado', event.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
              </select>

              <button className="btn-ghost" type="button" onClick={clearFilters}>Limpiar filtros</button>
              <button className="btn-secondary btn-inline" type="button" onClick={refresh} disabled={loading}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>

            {canManage && (
              <button className="btn-primary btn-new" type="button" onClick={() => setFormOpen(true)}>
                <Plus size={16} /> Nueva asignación
              </button>
            )}
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando asignaciones docentes...</div>
            ) : asignaciones.length === 0 ? (
              <div className="empty-state">No hay asignaciones para mostrar.</div>
            ) : (
              <div className="asignacion-table-wrapper">
                <table className="asignacion-table">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Materia</th>
                      <th>Docente</th>
                      <th>Correo</th>
                      <th>Grupos asignados</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((asignacion) => {
                      const grupo = getGrupo(asignacion);
                      const materia = getMateria(asignacion);
                      const docente = getDocente(asignacion);
                      const estado = String(asignacion.estado || '').toUpperCase();

                      return (
                        <tr key={asignacion.id}>
                          <td><strong>{grupo.codigo || 'Sin codigo'}</strong><span>{grupo.nombre || 'Grupo CUP'}</span></td>
                          <td>{getMateriaNombre(materia)}</td>
                          <td>{fullName(docente)}</td>
                          <td>{getCorreo(docente)}</td>
                          <td>{getGruposCount(asignacion)} / {getMaxGrupos(asignacion)}</td>
                          <td><EstadoAsignacionBadge estado={asignacion.estado} /></td>
                          <td>{formatDate(asignacion.created_at || asignacion.fecha_creacion)}</td>
                          <td>
                            <div className="row-actions">
                              <button className="icon-action" type="button" onClick={() => loadDetail(asignacion)} title="Ver detalle">
                                <Eye size={17} />
                              </button>
                              {canManage && estado === 'ACTIVA' && (
                                <button
                                  className="icon-action danger"
                                  type="button"
                                  onClick={() => changeEstado(asignacion, 'inactivar')}
                                  title="Inactivar"
                                  disabled={actionLoading}
                                >
                                  <Ban size={17} />
                                </button>
                              )}
                              {canManage && estado === 'INACTIVA' && (
                                <button
                                  className="icon-action success"
                                  type="button"
                                  onClick={() => changeEstado(asignacion, 'reactivar')}
                                  title="Reactivar"
                                  disabled={actionLoading}
                                >
                                  <PlayCircle size={17} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <AsignacionDocenteFormModal
          open={formOpen}
          saving={saving}
          backendError={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={handleCreate}
        />
        <AsignacionDocenteDetailModal asignacion={detail} onClose={() => setDetail(null)} />
      </main>
    </div>
  );
}
