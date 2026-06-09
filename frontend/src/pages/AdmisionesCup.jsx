import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, RefreshCcw, Play, AlertCircle, Trash2, Search, XCircle, GraduationCap, Users } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AdmisionesCupTable from '../components/AdmisionesCupTable';
import AdmisionCupDetailModal from '../components/AdmisionCupDetailModal';
import admisionesCupService from '../services/admisionesCup';
import carrerasService from '../services/carreras';
import '../styles/admisionesCup.css';

const getRole = () => {
  try {
    const stored = sessionStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    return user?.role?.toLowerCase() || '';
  } catch {
    return '';
  }
};

const emptyResumen = {
  total_postulantes: 0,
  aprobados_academicos: 0,
  reprobados_academicos: 0,
  pendientes_academicos: 0,
  admitidos_primera_opcion: 0,
  admitidos_segunda_opcion: 0,
  aprobados_sin_cupo: 0,
  reprobados: 0,
  pendientes: 0,
  cupos_por_carrera: [],
  admitidos_por_carrera: {}
};

const getCarreraNombre = (carrera) => {
  if (!carrera) return 'Sin carrera';
  if (typeof carrera === 'string') return carrera;
  if (typeof carrera === 'object') return carrera.nombre ?? carrera.descripcion ?? `Carrera ${carrera.id ?? ''}`;
  return String(carrera);
};

const getAdmitidosCount = (item) => {
  if (!item) return 0;
  if (typeof item === 'number') return item;
  if (typeof item === 'object') return Number(item.admitidos_count ?? item.total ?? item.count ?? 0);
  return 0;
};

export default function AdmisionesCup() {
  const [resumen, setResumen] = useState(emptyResumen);
  const [admisiones, setAdmisiones] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [detailAdmision, setDetailAdmision] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    estado_admision: '',
    carrera_asignada_id: '',
    primera_carrera_id: '',
    segunda_carrera_id: '',
    sort_promedio: 'desc'
  });

  const role = getRole();
  const canManage = ['admin', 'administrador', 'coordinador'].includes(role);

  // Load list of careers for filters
  const loadCarreras = useCallback(async () => {
    try {
      const response = await carrerasService.getCarreras();
      const payload = response?.data ?? response;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setCarreras(list);
    } catch (err) {
      console.warn('No se pudieron cargar las carreras directamente de la API:', err);
    }
  }, []);

  // Fetch Summary statistics and admissions list
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      // Fetch summary statistics
      const summaryRes = await admisionesCupService.getResumenAdmisionesCup();
      const normalizedSummary = admisionesCupService.normalizePayload(summaryRes);
      
      // Merge with default values in case some fields are missing
      setResumen({
        ...emptyResumen,
        ...normalizedSummary
      });

      // Fetch admissions list
      const listParams = {
        search: filters.search.trim() || undefined,
        estado_admision: filters.estado_admision || undefined,
        carrera_asignada_id: filters.carrera_asignada_id || undefined,
        primera_carrera_id: filters.primera_carrera_id || undefined,
        segunda_carrera_id: filters.segunda_carrera_id || undefined,
        sort_promedio: filters.sort_promedio || undefined
      };

      const listRes = await admisionesCupService.getAdmisionesCup(listParams);
      const list = admisionesCupService.normalizeList(listRes);
      setAdmisiones(list);
    } catch (err) {
      setError(admisionesCupService.getBackendError(err, 'Error al cargar los datos de admisión.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCarreras();
  }, [loadCarreras]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract careers dynamically from results if the API call to /carreras failed or returned empty
  const availableCarreras = useMemo(() => {
    const safeCarreras = Array.isArray(carreras) ? carreras : [];
    if (safeCarreras.length > 0) return safeCarreras;

    // Fallback dynamic extraction to ensure filters always work
    const map = new Map();
    const safeAdmisiones = Array.isArray(admisiones) ? admisiones : [];
    safeAdmisiones.forEach((item) => {
      if (!item) return;
      if (item.primera_carrera?.id && item.primera_carrera?.nombre) {
        map.set(String(item.primera_carrera.id), item.primera_carrera);
      }
      if (item.segunda_carrera?.id && item.segunda_carrera?.nombre) {
        map.set(String(item.segunda_carrera.id), item.segunda_carrera);
      }
      if (item.carrera_asignada?.id && item.carrera_asignada?.nombre) {
        map.set(String(item.carrera_asignada.id), item.carrera_asignada);
      }
    });
    return Array.from(map.values());
  }, [carreras, admisiones]);

  const handleProcesar = async () => {
    const confirm = window.confirm('Este proceso calculará el ranking y asignará cupos según primera y segunda opción. ¿Deseas continuar?');
    if (!confirm) return;

    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const response = await admisionesCupService.procesarAdmisionesCup();
      setMessage(response?.message || 'Proceso de admisión ejecutado correctamente.');
      await loadData();
    } catch (err) {
      setError(admisionesCupService.getBackendError(err, 'Error al procesar la admisión.'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReprocesar = async () => {
    const confirm = window.confirm('El reprocesamiento recalculará los resultados según las notas y cupos actuales. No duplicará registros. ¿Deseas continuar?');
    if (!confirm) return;

    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const response = await admisionesCupService.reprocesarAdmisionesCup();
      setMessage(response?.message || 'Proceso de admisión recalculado correctamente.');
      await loadData();
    } catch (err) {
      setError(admisionesCupService.getBackendError(err, 'Error al reprocesar la admisión.'));
    } finally {
      setProcessing(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado_admision: '',
      carrera_asignada_id: '',
      primera_carrera_id: '',
      segunda_carrera_id: '',
      sort_promedio: 'desc'
    });
  };

  const openDetail = async (item) => {
    try {
      // Call endpoint to get detail
      const res = await admisionesCupService.getAdmisionCup(item?.id);
      const detail = admisionesCupService.normalizePayload(res);
      setDetailAdmision(detail || item);
    } catch (err) {
      console.error('No se pudo obtener el detalle de la admisión desde el servidor. Mostrando datos locales.', err);
      setDetailAdmision(item);
    }
  };

  return (
    <div className="app-shell admisiones-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Admisión por cupos" breadcrumb="Sistema de Admisión CUP / Admisión por cupos" />

        <div className="content-inner">
          
          {/* Cabecera y acciones principales */}
          <div className="admisiones-heading">
            <div>
              <h2>Admisión por cupos</h2>
              <p>Procesa la admisión final de los postulantes aprobados según promedio, ranking y cupos por carrera.</p>
            </div>
            <div className="heading-actions">
              <button
                className="btn-secondary btn-inline"
                type="button"
                onClick={loadData}
                disabled={loading || processing}
              >
                <RefreshCcw size={16} /> Actualizar
              </button>

              {canManage && (
                <>
                  <button
                    className="btn-primary btn-inline"
                    type="button"
                    onClick={handleProcesar}
                    disabled={loading || processing}
                    style={{ backgroundColor: '#16a34a', boxShadow: '0 10px 18px rgba(22, 163, 74, 0.18)' }}
                  >
                    <Play size={16} /> Procesar admisión
                  </button>
                  <button
                    className="btn-primary btn-inline"
                    type="button"
                    onClick={handleReprocesar}
                    disabled={loading || processing}
                  >
                    <RefreshCcw size={16} /> Reprocesar admisión
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mensajes y Alertas */}
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}
          {processing && <div className="message info" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>Procesando asignación de cupos, por favor espere...</div>}

          {/* Tarjetas de estadísticas */}
          <div className="admisiones-stats">
            <StatCard
              title="Total Postulantes"
              value={resumen?.total_postulantes ?? 0}
              accent="#003B73"
            />
            <StatCard
              title="Aprobados Académicos"
              value={resumen?.aprobados_academicos ?? 0}
              accent="#0f766e"
            />
            <StatCard
              title="Reprobados Académicos"
              value={resumen?.reprobados_academicos ?? 0}
              accent="#b91c1c"
            />
            <StatCard
              title="Pendientes Académicos"
              value={resumen?.pendientes_academicos ?? 0}
              accent="#475569"
            />
            <StatCard
              title="Admitidos 1ra Opción"
              value={resumen?.admitidos_primera_opcion ?? 0}
              accent="#16a34a"
            />
            <StatCard
              title="Admitidos 2da Opción"
              value={resumen?.admitidos_segunda_opcion ?? 0}
              accent="#2563eb"
            />
            <StatCard
              title="Aprobados sin Cupo"
              value={resumen?.aprobados_sin_cupo ?? 0}
              accent="#d97706"
            />
            <StatCard
              title="Reprobados Finales"
              value={resumen?.reprobados ?? 0}
              accent="#dc2626"
            />
            <StatCard
              title="Pendientes Finales"
              value={resumen?.pendientes ?? 0}
              accent="#64748b"
            />
          </div>

          {/* Sección de Cupos por Carrera */}
          {Array.isArray(resumen?.cupos_por_carrera) && resumen.cupos_por_carrera.length > 0 && (
            <div className="carreras-cupos-section">
              <h3 className="carreras-cupos-title">
                <GraduationCap size={18} />
                <span>Cupos y Admitidos por Carrera</span>
              </h3>
              <div className="carreras-cupos-grid">
                {resumen.cupos_por_carrera.map((carrera) => {
                  if (!carrera) return null;
                  const cuposMax = carrera.cupos || carrera.cantidad_cupos || 0;
                  const carreraId = carrera.id;
                  
                  // Read admitidosCount value safely using our helper
                  const admitidosRaw =
                    resumen.admitidos_por_carrera?.[carreraId] ||
                    resumen.admitidos_por_carrera?.[carrera.nombre] ||
                    carrera.admitidos ||
                    0;
                  const admitidosCount = getAdmitidosCount(admitidosRaw);

                  const pct = cuposMax > 0 ? Math.min(100, (admitidosCount / cuposMax) * 100) : 0;

                  return (
                    <div key={carrera.id} className="carrera-cupo-card">
                      <div className="carrera-cupo-name">{getCarreraNombre(carrera)}</div>
                      <div className="carrera-cupo-progress-wrapper">
                        <div className="carrera-cupo-progress-bar">
                          <div
                            className="carrera-cupo-progress-fill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#003B73'
                            }}
                          />
                        </div>
                        <div className="carrera-cupo-details">
                          <span>Admitidos: <strong>{admitidosCount}</strong></span>
                          <span>Cupos: <strong>{cuposMax}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barra de Filtros */}
          <div className="admisiones-controls">
            <div className="admisiones-filters">
              
              {/* Buscador de CI o Nombre */}
              <div className="filter-group" style={{ padding: '0 8px', minHeight: '42px', flex: 1.5 }}>
                <Search size={18} style={{ color: '#64748b', marginRight: '6px' }} />
                <input
                  type="text"
                  placeholder="Buscar por CI o nombre..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={{ border: 'none', minHeight: 'auto', padding: 0 }}
                />
              </div>

              {/* Estado de Admisión */}
              <select
                value={filters.estado_admision}
                onChange={(e) => setFilters({ ...filters, estado_admision: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="ADMITIDO_PRIMERA_OPCION">Admitido 1ra opción</option>
                <option value="ADMITIDO_SEGUNDA_OPCION">Admitido 2da opción</option>
                <option value="APROBADO_SIN_CUPO">Aprobado sin cupo</option>
                <option value="REPROBADO">Reprobado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>

              {/* Carrera Asignada */}
              <select
                value={filters.carrera_asignada_id}
                onChange={(e) => setFilters({ ...filters, carrera_asignada_id: e.target.value })}
              >
                <option value="">Carrera Asignada: Todas</option>
                {availableCarreras.map((c) => (
                  <option key={c?.id || ''} value={c?.id || ''}>{c?.nombre || 'Carrera'}</option>
                ))}
              </select>

              {/* Primera Carrera */}
              <select
                value={filters.primera_carrera_id}
                onChange={(e) => setFilters({ ...filters, primera_carrera_id: e.target.value })}
              >
                <option value="">1ra Carrera: Todas</option>
                {availableCarreras.map((c) => (
                  <option key={c?.id || ''} value={c?.id || ''}>{c?.nombre || 'Carrera'}</option>
                ))}
              </select>

              {/* Segunda Carrera */}
              <select
                value={filters.segunda_carrera_id}
                onChange={(e) => setFilters({ ...filters, segunda_carrera_id: e.target.value })}
              >
                <option value="">2da Carrera: Todas</option>
                {availableCarreras.map((c) => (
                  <option key={c?.id || ''} value={c?.id || ''}>{c?.nombre || 'Carrera'}</option>
                ))}
              </select>

              {/* Orden por promedio */}
              <select
                value={filters.sort_promedio}
                onChange={(e) => setFilters({ ...filters, sort_promedio: e.target.value })}
              >
                <option value="desc">Promedio: Descendente</option>
                <option value="asc">Promedio: Ascendente</option>
              </select>

              {/* Limpiar Filtros */}
              <button
                className="btn-ghost btn-inline"
                type="button"
                onClick={clearFilters}
                style={{ minHeight: '42px', width: 'auto' }}
              >
                <XCircle size={16} /> Limpiar
              </button>
            </div>
          </div>

          {/* Tabla de resultados */}
          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando resultados de admisión por cupos...</div>
            ) : (
              <AdmisionesCupTable
                admisiones={admisiones}
                onView={openDetail}
              />
            )}
          </div>

        </div>

        {/* Modal de Detalle */}
        {detailAdmision && (
          <AdmisionCupDetailModal
            admision={detailAdmision}
            onClose={() => setDetailAdmision(null)}
          />
        )}
      </main>
    </div>
  );
}
