import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCcw, Play, Search, XCircle, GraduationCap, Info } from 'lucide-react';
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
  total_aprobados_academicos: 0,
  total_reprobados_academicos: 0,
  total_pendientes_academicos: 0,
  admitidos_primera_opcion: 0,
  admitidos_segunda_opcion: 0,
  aprobados_sin_cupo: 0,
  reprobados: 0,
  pendientes: 0,
  cupos_por_carrera: [],
  admitidos_por_carrera: []
};

const getCuposTotales = (carrera) => {
  if (!carrera || typeof carrera !== 'object') return 0;
  const value =
    carrera.cupos_totales ??
    carrera.cupos ??
    carrera.cupo ??
    carrera.cupos_habilitados ??
    carrera.cupos_ofertados ??
    carrera.cantidad_cupos ??
    carrera.total_cupos ??
    carrera.cupos_disponibles ??
    carrera.cupo_maximo ??
    carrera.limite_cupos ??
    0;
  return Number(value) || 0;
};

const getAdmitidosCount = (item) => {
  if (!item) return 0;
  if (typeof item === 'number') return item;
  if (typeof item === 'object') {
    const value =
      item.admitidos_count ??
      item.total_admitidos ??
      item.admitidos ??
      item.count ??
      item.total ??
      item.cupos_ocupados ??
      0;
    return Number(value) || 0;
  }
  return 0;
};

const getCarreraNombre = (carrera) => {
  if (!carrera) return 'Sin carrera';
  if (typeof carrera === 'string') return carrera;
  if (typeof carrera === 'object') {
    return (
      carrera.nombre ??
      carrera.descripcion ??
      carrera.carrera ??
      carrera.nombre_carrera ??
      `Carrera ${carrera.id ?? ''}`
    );
  }
  return String(carrera);
};

const getCarreraId = (carrera) => {
  if (!carrera || typeof carrera !== 'object') return null;
  return carrera.id ?? carrera.carrera_id ?? carrera.id_carrera ?? null;
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
    sort_promedio: 'desc'
  });


  const role = getRole();
  const canManage = ['admin', 'administrador', 'coordinador'].includes(role);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const summaryRes = await admisionesCupService.getResumenAdmisionesCup();
      const normalizedSummary = admisionesCupService.normalizePayload(summaryRes);
      setResumen({ ...emptyResumen, ...normalizedSummary });

      const listParams = {
        search: filters.search.trim() || undefined,
        estado_admision: filters.estado_admision === 'ADMITIDO' ? undefined : (filters.estado_admision || undefined),
        carrera_asignada_id: filters.carrera_asignada_id || undefined,
        sort_promedio: filters.sort_promedio || undefined,
        per_page: 100
      };

      const listRes = await admisionesCupService.getAdmisionesCup(listParams);
      let list = admisionesCupService.normalizeList(listRes);
      if (filters.estado_admision === 'ADMITIDO') {
        list = list.filter(
          (item) =>
            item.estado_admision === 'ADMITIDO_PRIMERA_OPCION' ||
            item.estado_admision === 'ADMITIDO_SEGUNDA_OPCION'
        );
      }
      setAdmisiones(list);
    } catch (err) {
      setError(admisionesCupService.getBackendError(err, 'Error al cargar los datos de admisión.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadCarreras(); }, [loadCarreras]);
  useEffect(() => { loadData(); }, [loadData]);

  const availableCarreras = useMemo(() => {
    const safeCarreras = Array.isArray(carreras) ? carreras : [];
    if (safeCarreras.length > 0) return safeCarreras;

    const map = new Map();
    const safeAdmisiones = Array.isArray(admisiones) ? admisiones : [];
    safeAdmisiones.forEach((item) => {
      if (!item) return;
      if (item.primera_carrera?.id && item.primera_carrera?.nombre)
        map.set(String(item.primera_carrera.id), item.primera_carrera);
      if (item.segunda_carrera?.id && item.segunda_carrera?.nombre)
        map.set(String(item.segunda_carrera.id), item.segunda_carrera);
      if (item.carrera_asignada?.id && item.carrera_asignada?.nombre)
        map.set(String(item.carrera_asignada.id), item.carrera_asignada);
    });
    return Array.from(map.values());
  }, [carreras, admisiones]);

  const resumenCarreras = useMemo(() => {
    const cuposPorCarrera = Array.isArray(resumen?.cupos_por_carrera)
      ? resumen.cupos_por_carrera
      : [];

    const admitidosPorCarrera = Array.isArray(resumen?.admitidos_por_carrera)
      ? resumen.admitidos_por_carrera
      : [];

    const carrerasBase = cuposPorCarrera.length > 0
      ? cuposPorCarrera
      : availableCarreras;

    return carrerasBase.map((carrera) => {
      const carreraId = getCarreraId(carrera);

      const admitidosItem = admitidosPorCarrera.find((item) => {
        const itemId = getCarreraId(item);
        return itemId && carreraId && String(itemId) === String(carreraId);
      });

      const cuposTotales = getCuposTotales(carrera);
      const admitidos = getAdmitidosCount(admitidosItem);
      const disponibles = Math.max(cuposTotales - admitidos, 0);
      const ocupacion = cuposTotales > 0 ? Math.round((admitidos / cuposTotales) * 100) : 0;

      return {
        id: carreraId,
        nombre: getCarreraNombre(carrera),
        cuposTotales,
        admitidos,
        disponibles,
        ocupacion,
      };
    });
  }, [resumen, availableCarreras]);

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
      sort_promedio: 'desc'
    });
  };

  const openDetail = async (item) => {
    try {
      const res = await admisionesCupService.getAdmisionCup(item?.id);
      const detail = admisionesCupService.normalizePayload(res);
      setDetailAdmision(detail || item);
    } catch (err) {
      console.error('No se pudo obtener el detalle desde el servidor. Mostrando datos locales.', err);
      setDetailAdmision(item);
    }
  };

  const totalAdmitidos = (resumen?.admitidos_primera_opcion ?? 0) + (resumen?.admitidos_segunda_opcion ?? 0);
  const totalPendientes = resumen?.pendientes ?? 0;
  const totalReprobados = resumen?.reprobados ?? 0;
  const totalPostulantes = resumen?.total_postulantes ?? 0;

  const showPendientesAlert = totalPostulantes > 0 && totalPendientes / totalPostulantes >= 0.5;
  const showSinAdmitidosAlert = totalAdmitidos === 0 && totalPostulantes > 0 && !showPendientesAlert;

  return (
    <div className="app-shell admisiones-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Admisión por cupos" breadcrumb="Sistema de Admisión CUP / Admisión por cupos" />

        <div className="content-inner">

          {/* Cabecera y acciones */}
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

          {/* Mensajes */}
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}
          {processing && (
            <div className="message info" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
              Procesando asignación de cupos, por favor espere...
            </div>
          )}

          {/* 5 Tarjetas de estadísticas */}
          <div className="admisiones-stats">
            <StatCard title="Total Postulantes" value={totalPostulantes} accent="#003B73" />
            <StatCard title="Aprobados Académicos" value={resumen?.total_aprobados_academicos ?? 0} accent="#0f766e" />
            <StatCard title="Admitidos" value={totalAdmitidos} accent="#16a34a" />
            <StatCard title="Aprobados sin Cupo" value={resumen?.aprobados_sin_cupo ?? 0} accent="#d97706" />
            <div className="stat-card stat-doble-card">
              <div className="stat-doble-row">
                <span className="stat-doble-label">Pendientes</span>
                <strong className="stat-doble-value stat-doble-pendientes">{totalPendientes}</strong>
              </div>
              <div className="stat-doble-divider" />
              <div className="stat-doble-row">
                <span className="stat-doble-label">Reprobados</span>
                <strong className="stat-doble-value stat-doble-reprobados">{totalReprobados}</strong>
              </div>
            </div>
          </div>

          {/* Alertas informativas */}
          {showPendientesAlert && (
            <div className="alert-info-cup">
              <Info size={16} />
              <span>La mayoría de postulantes aún no tiene las 4 materias evaluadas en CU14. Solo los aprobados académicamente entrarán al ranking por cupos.</span>
            </div>
          )}
          {showSinAdmitidosAlert && (
            <div className="alert-info-cup alert-info-cup--gray">
              <Info size={16} />
              <span>Todavía no existen postulantes admitidos. Procesa la admisión cuando existan postulantes con las 4 materias aprobadas.</span>
            </div>
          )}

          {/* Tabla compacta: Resumen de cupos por carrera */}
          {resumenCarreras.length > 0 && (
            <div className="cupos-resumen-section">
              <h3 className="cupos-resumen-title">
                <GraduationCap size={16} />
                <span>Resumen de cupos por carrera</span>
              </h3>
              <div className="cupos-resumen-table-wrapper">
                <table className="cupos-resumen-table">
                  <thead>
                    <tr>
                      <th>Carrera</th>
                      <th>Cupos configurados</th>
                      <th>Admitidos</th>
                      <th>Disponibles</th>
                      <th>Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenCarreras.map((row) => (
                      <tr key={row.id ?? row.nombre}>
                        <td className="cupos-carrera-nombre">{row.nombre}</td>
                        <td>
                          {row.cuposTotales > 0
                            ? row.cuposTotales
                            : <span className="text-muted">Sin cupos configurados</span>
                          }
                        </td>
                        <td>{row.admitidos}</td>
                        <td>{row.cuposTotales > 0 ? row.disponibles : <span className="text-muted">—</span>}</td>
                        <td>
                          <div className="ocupacion-cell">
                            <div className="ocupacion-bar-bg">
                              <div
                                className="ocupacion-bar-fill"
                                style={{
                                  width: `${row.ocupacion}%`,
                                  backgroundColor:
                                    row.ocupacion >= 100 ? '#dc2626'
                                    : row.ocupacion >= 80 ? '#d97706'
                                    : '#003B73'
                                }}
                              />
                            </div>
                            <span className="ocupacion-pct">{row.ocupacion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="admisiones-controls">
            <div className="admisiones-filters">
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

              <select
                value={filters.estado_admision}
                onChange={(e) => setFilters({ ...filters, estado_admision: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="ADMITIDO">Admitido</option>
                <option value="APROBADO_SIN_CUPO">Aprobado sin cupo</option>
                <option value="REPROBADO">Reprobado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>

              <select
                value={filters.carrera_asignada_id}
                onChange={(e) => setFilters({ ...filters, carrera_asignada_id: e.target.value })}
              >
                <option value="">Carrera Asignada: Todas</option>
                {availableCarreras.map((c) => (
                  <option key={c?.id || ''} value={c?.id || ''}>{c?.nombre || 'Carrera'}</option>
                ))}
              </select>

              <select
                value={filters.sort_promedio}
                onChange={(e) => setFilters({ ...filters, sort_promedio: e.target.value })}
              >
                <option value="desc">Promedio: Desc</option>
                <option value="asc">Promedio: Asc</option>
              </select>

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

          {/* Tabla principal */}
          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando resultados de admisión por cupos...</div>
            ) : (
              <AdmisionesCupTable admisiones={admisiones} onView={openDetail} />
            )}
          </div>

        </div>

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
