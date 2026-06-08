import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Eye, PlayCircle, RefreshCcw, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EstadoGrupoBadge from '../components/EstadoGrupoBadge';
import GrupoHorarioAdminModal from '../components/GrupoHorarioAdminModal';
import * as gruposCupService from '../services/gruposCup';
import '../styles/gruposCup.css';

const manageRoles = ['admin', 'administrador', 'coordinador'];

const emptyResumen = {
  total_inscritos: 0,
  capacidad_por_grupo: 70,
  grupos_calculados: 0,
  grupos_generados: 0,
  estudiantes_asignados: 0,
  estudiantes_pendientes: 0,
};

const extractPayload = (response) => response?.data || response || {};

const extractList = (response) => {
  const payload = extractPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.grupos)) return payload.grupos;
  if (Array.isArray(payload?.grupos_cup)) return payload.grupos_cup;
  return [];
};

const getRole = () => {
  try {
    const stored = sessionStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    return user?.role?.toLowerCase() || '';
  } catch {
    return '';
  }
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  return data?.message || data?.error || fallback;
};

const normalizeActionMessage = (message, fallback) => {
  const clean = message || fallback;
  const lower = clean.toLowerCase();

  if (lower.includes('ya fueron generados')) {
    return 'Los grupos ya fueron generados.';
  }

  if (lower.includes('no existen postulantes') || lower.includes('no hay inscritos') || lower.includes('sin inscritos')) {
    return 'No existen postulantes inscritos para generar grupos.';
  }

  return clean;
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

export default function GestionGruposCup() {
  const [resumen, setResumen] = useState(emptyResumen);
  const [grupos, setGrupos] = useState([]);
  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [horarioDetail, setHorarioDetail] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const role = getRole();
  const canManage = manageRoles.includes(role);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [resumenResponse, gruposResponse] = await Promise.all([
        gruposCupService.getResumenGruposCup(),
        gruposCupService.getGruposCup(),
      ]);
      setResumen({ ...emptyResumen, ...extractPayload(resumenResponse) });
      setGrupos(extractList(gruposResponse));
    } catch (e) {
      setError(getBackendError(e, 'Error al cargar resumen o listar grupos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredGrupos = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const estado = filters.estado;

    return grupos.filter((grupo) => {
      const searchable = [grupo.codigo, grupo.nombre].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      const matchesEstado = !estado || String(grupo.estado || '').toUpperCase() === estado;
      return matchesSearch && matchesEstado;
    });
  }, [grupos, filters]);

  const clearFilters = () => {
    setFilters({ search: '', estado: '' });
  };

  const handleRefresh = () => {
    setMessage('');
    loadData();
  };

  const handleGenerate = async () => {
    if (!canManage) return;
    const confirmed = window.confirm('Se generarán grupos automáticamente con los postulantes inscritos. ¿Deseas continuar?');
    if (!confirmed) return;

    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await gruposCupService.generarGruposCup();
      const actionMessage = normalizeActionMessage(response?.message || response?.data?.message, 'Grupos generados correctamente.');
      setMessage(actionMessage);
      await loadData();
    } catch (e) {
      setError(normalizeActionMessage(getBackendError(e, 'Error al generar grupos.'), 'Error al generar grupos.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewHorario = async (grupo) => {
    setMessage('');
    setError('');
    try {
      const response = await gruposCupService.getHorarioGrupoCup(grupo.id);
      setHorarioDetail(response);
    } catch (e) {
      setError(getBackendError(e, 'Error al cargar horario del grupo.'));
    }
  };

  const handleInactivar = async (grupo) => {
    if (!canManage) return;
    if (!window.confirm(`¿Inactivar el grupo "${grupo.codigo || grupo.nombre}"?`)) return;

    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await gruposCupService.inactivarGrupoCup(grupo.id);
      setMessage(response?.message || response?.data?.message || 'Grupo inactivado correctamente.');
      await loadData();
    } catch (e) {
      setError(getBackendError(e, 'Error al inactivar grupo.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="app-shell grupos-cup-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Grupos CUP" breadcrumb="Sistema de Admisión CUP / Grupos CUP" />

        <div className="content-inner">
          <div className="grupos-heading">
            <p>Calcula grupos habilitados y organiza postulantes inscritos según capacidad máxima de 70 estudiantes.</p>
          </div>

          <div className="stats-row grupos-stats">
            <StatCard title="Total inscritos" value={resumen.total_inscritos ?? 0} accent="#003B73" />
            <StatCard title="Capacidad por grupo" value={resumen.capacidad_por_grupo ?? 70} accent="#0056B3" />
            <StatCard title="Grupos calculados" value={resumen.grupos_calculados ?? 0} accent="#0F766E" />
            <StatCard title="Grupos generados" value={resumen.grupos_generados ?? 0} accent="#16A34A" />
            <StatCard title="Estudiantes asignados" value={resumen.estudiantes_asignados ?? 0} accent="#2563EB" />
            <StatCard title="Estudiantes pendientes" value={resumen.estudiantes_pendientes ?? 0} accent="#F97316" />
          </div>

          <div className="controls-row grupos-controls">
            <div className="filters grupos-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre del grupo"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="HABILITADO">Habilitado</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              <button className="btn-ghost" type="button" onClick={clearFilters}>Limpiar filtros</button>
            </div>
            <div className="grupos-actions">
              {canManage && (
                <button className="btn-primary btn-inline" type="button" onClick={handleGenerate} disabled={actionLoading}>
                  <PlayCircle size={16} /> Generar grupos
                </button>
              )}
              <button className="btn-secondary btn-inline" type="button" onClick={handleRefresh} disabled={loading || actionLoading}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando grupos CUP...</div>
            ) : filteredGrupos.length === 0 ? (
              <div className="empty-state">No hay grupos para mostrar.</div>
            ) : (
              <div className="grupos-table-wrapper">
                <table className="grupos-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Grupo</th>
                      <th>Capacidad máxima</th>
                      <th>Estudiantes asignados</th>
                      <th>Estado</th>
                      <th>Fecha de creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrupos.map((grupo) => (
                      <tr key={grupo.id}>
                        <td><strong>{grupo.codigo || 'Sin código'}</strong></td>
                        <td>{grupo.nombre || 'Sin nombre'}</td>
                        <td>{grupo.capacidad_maxima ?? 70}</td>
                        <td>{grupo.cantidad_estudiantes ?? 0}</td>
                        <td><EstadoGrupoBadge estado={grupo.estado} /></td>
                        <td>{formatDate(grupo.created_at)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-action" type="button" onClick={() => handleViewHorario(grupo)} title="Ver horario">
                              <Eye size={17} />
                            </button>
                            {canManage && (
                              <button
                                className="icon-action danger"
                                type="button"
                                onClick={() => handleInactivar(grupo)}
                                title="Inactivar grupo"
                                disabled={String(grupo.estado || '').toUpperCase() === 'INACTIVO' || actionLoading}
                              >
                                <Ban size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <GrupoHorarioAdminModal detail={horarioDetail} onClose={() => setHorarioDetail(null)} />
      </main>
    </div>
  );
}
