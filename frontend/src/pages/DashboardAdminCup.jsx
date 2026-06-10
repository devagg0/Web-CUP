import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, CheckCircle, XCircle, UsersRound, GraduationCap,
  Award, Clock, TrendingUp, RefreshCw, LayoutDashboard,
  ClipboardList, BookOpen, Trophy, BarChart3, Activity,
  AlertTriangle, Layers, UserCheck, CalendarCheck,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/dashboard/MetricCard';
import AlertCard from '../components/dashboard/AlertCard';
import QuickAccessCard from '../components/dashboard/QuickAccessCard';
import { getDashboardCupResumen } from '../services/dashboardCup';
import '../styles/dashboardAdminCup.css';

// ─── Paleta ───────────────────────────────────────────────
const C = {
  primary : '#003B73',
  blue    : '#0ea5e9',
  green   : '#10b981',
  red     : '#ef4444',
  amber   : '#f59e0b',
  purple  : '#6366f1',
  teal    : '#14b8a6',
  indigo  : '#4f46e5',
  orange  : '#f97316',
};

const PIE_COLORS   = [C.green, C.red, C.amber];
const ROUNDING     = [6, 6, 0, 0];

// ─── Tooltip personalizado ────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip__label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: p.fill || p.color }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

// ─── Label personalizado para el donut ───────────────────
function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-6" fontSize={26} fontWeight={800} fill="#1e293b">{total}</tspan>
      <tspan x={cx} dy={22} fontSize={12} fill="#64748b">total</tspan>
    </text>
  );
}

// ─── Helpers seguros ─────────────────────────────────────
const n  = (v) => (typeof v === 'number' && isFinite(v) ? v : (parseFloat(v) || 0));
const sa = (v) => (Array.isArray(v) ? v : []);

export default function DashboardAdminCup() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardCupResumen();
      setData(result);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cargar el panel administrativo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Extraer datos seguros ──────────────────────────────
  const m  = data?.metricas_principales ?? {};
  const ep = data?.estado_proceso ?? {};

  const distribucion = sa(data?.distribucion_academica);
  const demanda      = sa(data?.demanda_carreras);
  const cupos        = sa(data?.cupos_por_carrera);
  const materias     = sa(data?.estadisticas_materia);
  const grupos       = sa(data?.rendimiento_grupos);
  const alertas      = sa(data?.alertas);

  // Proceso CUP para BarChart
  const procesoData = [
    { etapa: 'Preinscripciones',   total: n(ep.preinscripciones) },
    { etapa: 'Inscritos',          total: n(ep.inscritos) },
    { etapa: 'Con alguna nota',    total: n(ep.evaluados) },
    { etapa: 'Eval. Completa',     total: n(ep.evaluados_completos) },
    { etapa: 'Admitidos',          total: n(ep.admitidos) },
  ];

  // Materias para BarChart dual
  const materiasChart = materias.map(mat => ({
    materia:   mat.materia?.length > 12 ? mat.materia.substring(0, 12) + '…' : (mat.materia ?? ''),
    Aprobados: n(mat.aprobados),
    Reprobados: n(mat.reprobados),
    promedio:  n(mat.promedio),
  }));

  // Demanda para BarChart horizontal
  const demandaChart = demanda.map(d => ({
    carrera: d.carrera?.length > 18 ? d.carrera.substring(0, 18) + '…' : (d.carrera ?? ''),
    total:   n(d.total),
  }));

  const totalDistribucion = distribucion.reduce((acc, d) => acc + n(d.total), 0);

  // ── Render ────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Panel Administrativo CUP" breadcrumb="Inicio / Panel Administrativo" />

        <div className="dac-page">

          {/* ── ENCABEZADO ── */}
          <div className="dac-topbar">
            <div>
              <h1 className="dac-topbar__title">Panel Administrativo CUP</h1>
              <p className="dac-topbar__sub">
                Resumen visual del proceso de admisión, evaluación y asignación de cupos.
              </p>
            </div>
            <div className="dac-topbar__actions">
              {lastUpdate && (
                <span className="dac-timestamp">
                  Actualizado: {lastUpdate.toLocaleTimeString('es-BO')}
                </span>
              )}
              <button
                id="btn-actualizar-dashboard"
                className="dac-btn-refresh"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? 'dac-spin' : ''} />
                {loading ? 'Cargando…' : 'Actualizar'}
              </button>
            </div>
          </div>

          {/* ── ERROR ── */}
          {error && (
            <div className="dac-error">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {/* ── LOADING ── */}
          {loading && !data && (
            <div className="dac-loading">
              <div className="dac-loading__spinner" />
              <span>Cargando indicadores del sistema…</span>
            </div>
          )}

          {data && (
            <>
              {/* ════════════════════════════════════════════
                  FILA 1 — 4 KPIs obligatorios del PDF
              ════════════════════════════════════════════ */}
              <div className="dac-kpi-row">
                <MetricCard
                  title="Total Inscritos"
                  value={n(m.total_inscritos)}
                  icon={Users}
                  color={C.blue}
                  subtitle="estado = INSCRITO"
                />
                <MetricCard
                  title="Total Aprobados"
                  value={n(m.total_aprobados)}
                  icon={CheckCircle}
                  color={C.green}
                  subtitle="estado académico = APROBADO"
                />
                <MetricCard
                  title="Total Reprobados"
                  value={n(m.total_reprobados)}
                  icon={XCircle}
                  color={C.red}
                  subtitle="estado académico = REPROBADO"
                />
                <MetricCard
                  title="Grupos Habilitados"
                  value={n(m.total_grupos_habilitados)}
                  icon={UsersRound}
                  color={C.purple}
                  subtitle="estado = HABILITADO"
                />
              </div>

              {/* ════════════════════════════════════════════
                  FILA 2 — Indicadores adicionales compactos
              ════════════════════════════════════════════ */}
              <div className="dac-mini-row">
                <MetricCard compact title="Postulantes" value={n(m.total_postulantes)} icon={UsersRound} color={C.primary} />
                <MetricCard compact title="Admitidos"   value={n(m.total_admitidos)}   icon={Award}      color={C.teal}   />
                <MetricCard compact title="Pendientes"  value={n(m.total_pendientes)}  icon={Clock}      color={C.amber}  />
                <MetricCard compact title="Promedio"    value={n(m.promedio_general)}  icon={TrendingUp}  color={C.indigo} />
                <MetricCard compact title="Docentes"    value={n(m.total_docentes)}    icon={GraduationCap} color={C.purple} />
                <MetricCard compact title="Materias"    value={n(m.total_materias)}    icon={BookOpen}   color={C.blue}   />
                <MetricCard compact title="Sin cupo"    value={n(m.total_aprobados_sin_cupo)} icon={AlertTriangle} color={C.orange} />
              </div>

              {/* ════════════════════════════════════════════
                  FILA 3 — Proceso CUP | Distribución académica
              ════════════════════════════════════════════ */}
              <div className="dac-grid-2">

                {/* BarChart — Proceso CUP */}
                <div className="dac-chart-card">
                  <div className="dac-chart-card__header">
                    <Activity size={16} />
                    <span>Estado del proceso CUP</span>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={procesoData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="etapa" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="total" name="Total" radius={ROUNDING}>
                        {procesoData.map((_, i) => (
                          <Cell key={i} fill={[C.primary, C.blue, C.indigo, C.purple, C.green][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* PieChart — Distribución académica */}
                <div className="dac-chart-card">
                  <div className="dac-chart-card__header">
                    <BarChart3 size={16} />
                    <span>Distribución académica</span>
                  </div>
                  {totalDistribucion === 0 && !(n(m.total_postulantes) > 0 || n(m.total_inscritos) > 0) ? (
                    <div className="dac-no-data">No hay datos registrados para graficar.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={distribucion.map(d => ({ name: d.estado, value: n(d.total) }))}
                            cx="50%" cy="50%"
                            innerRadius={72} outerRadius={108}
                            paddingAngle={3}
                            dataKey="value"
                            labelLine={false}
                          >
                            {distribucion.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                            <DonutLabel total={totalDistribucion} />
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Leyenda manual */}
                      <div className="dac-pie-legend">
                        {distribucion.map((d, i) => (
                          <div key={i} className="dac-pie-legend__item">
                            <span className="dac-pie-legend__dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="dac-pie-legend__label">{d.estado}</span>
                            <span className="dac-pie-legend__value">{n(d.total)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  FILA 4 — Demanda carreras | Estadísticas materia
              ════════════════════════════════════════════ */}
              <div className="dac-grid-2">

                {/* BarChart horizontal — Demanda por carrera */}
                <div className="dac-chart-card">
                  <div className="dac-chart-card__header">
                    <BookOpen size={16} />
                    <span>Demanda por carrera (primera opción)</span>
                  </div>
                  {demandaChart.length === 0 ? (
                    <div className="dac-no-data">No hay demanda por carrera registrada.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(200, demandaChart.length * 52)}>
                      <BarChart
                        data={demandaChart}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="carrera" type="category" width={120} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="total" name="Postulantes" fill={C.primary} radius={ROUNDING} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* BarChart dual — Estadísticas por materia */}
                <div className="dac-chart-card">
                  <div className="dac-chart-card__header">
                    <Layers size={16} />
                    <span>Estadísticas por materia</span>
                  </div>
                  {materiasChart.length === 0 ? (
                    <div className="dac-no-data">No hay datos de materias.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={materiasChart} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="materia" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          <Bar dataKey="Aprobados"  fill={C.green} radius={ROUNDING} />
                          <Bar dataKey="Reprobados" fill={C.red}   radius={ROUNDING} />
                        </BarChart>
                      </ResponsiveContainer>
                      {/* Promedios por materia */}
                      <div className="dac-materias-promedios">
                        {materias.map((mat, i) => (
                          <div key={i} className="dac-promedio-chip">
                            <span className="dac-promedio-chip__name">{mat.materia}</span>
                            <span className="dac-promedio-chip__val" style={{ color: C.indigo }}>
                              prom. {n(mat.promedio)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  FILA 5 — Cupos por carrera | Rendimiento grupos
              ════════════════════════════════════════════ */}
              <div className="dac-grid-2">

                {/* Cupos por carrera */}
                <div className="dac-panel-card">
                  <div className="dac-chart-card__header">
                    <Award size={16} />
                    <span>Cupos por carrera</span>
                  </div>
                  {cupos.length === 0 ? (
                    <div className="dac-no-data">Sin datos de cupos.</div>
                  ) : (
                    <div className="dac-cupos-list">
                      {cupos.map((c, i) => {
                        const pct = n(c.ocupacion);
                        const barColor = pct >= 90 ? C.red : pct >= 60 ? C.amber : C.green;
                        return (
                          <div key={i} className="dac-cupo-item">
                            <div className="dac-cupo-item__header">
                              <span className="dac-cupo-item__name">{c.carrera}</span>
                              <span className="dac-cupo-item__meta">
                                {n(c.admitidos)}/{n(c.cupos)} admitidos
                              </span>
                            </div>
                            <div className="dac-progress-track">
                              <div
                                className="dac-progress-fill"
                                style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                              />
                            </div>
                            <div className="dac-cupo-item__footer">
                              <span style={{ color: C.green, fontSize: 11 }}>
                                {n(c.disponibles)} disponibles
                              </span>
                              <span style={{ color: barColor, fontWeight: 700, fontSize: 12 }}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Rendimiento por grupo */}
                <div className="dac-panel-card">
                  <div className="dac-chart-card__header">
                    <UsersRound size={16} />
                    <span>Rendimiento por grupo</span>
                  </div>
                  {grupos.length === 0 ? (
                    <div className="dac-no-data">Sin datos de grupos.</div>
                  ) : (
                    <div className="dac-grupos-list">
                      {grupos.map((g, i) => {
                        const pct = n(g.porcentaje_aprobacion);
                        const barColor = pct >= 70 ? C.green : pct >= 40 ? C.amber : C.red;
                        const isHabilitadoOrActivo = ['activo', 'habilitado'].includes((g.estado ?? '').toLowerCase());
                        return (
                          <div key={i} className="dac-grupo-item">
                            <div className="dac-grupo-item__header">
                              <div>
                                <span className="dac-grupo-item__name">{g.grupo}</span>
                                {g.codigo && <span className="dac-grupo-item__code"> · {g.codigo}</span>}
                              </div>
                              <div className="dac-grupo-item__badges">
                                <span className={`dac-estado-badge ${isHabilitadoOrActivo ? 'dac-badge--active' : 'dac-badge--inactive'}`}>
                                  {g.estado}
                                </span>
                              </div>
                            </div>
                            <div className="dac-grupo-item__pills">
                              <span className="dac-pill dac-pill--blue">👥 {n(g.total_estudiantes)}</span>
                              <span className="dac-pill dac-pill--green">✓ {n(g.aprobados)}</span>
                              <span className="dac-pill dac-pill--red">✕ {n(g.reprobados)}</span>
                              <span className="dac-pill dac-pill--amber">⏳ {n(g.pendientes)}</span>
                            </div>
                            <div className="dac-progress-track">
                              <div
                                className="dac-progress-fill"
                                style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
                              />
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 700, color: barColor, marginTop: 2 }}>
                              {pct}% aprobación
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ════════════════════════════════════════════
                  FILA 6 — Alertas | Accesos rápidos
              ════════════════════════════════════════════ */}
              <div className="dac-grid-2">

                {/* Alertas inteligentes */}
                <div className="dac-panel-card">
                  <div className="dac-chart-card__header">
                    <AlertTriangle size={16} />
                    <span>Alertas inteligentes</span>
                  </div>
                  {alertas.length === 0 ? (
                    <div className="dac-no-data">No hay alertas activas.</div>
                  ) : (
                    <div className="dac-alerts-list">
                      {alertas.map((a, i) => (
                        <AlertCard key={i} tipo={a.tipo} titulo={a.titulo} mensaje={a.mensaje} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Accesos rápidos */}
                <div className="dac-panel-card">
                  <div className="dac-chart-card__header">
                    <Activity size={16} />
                    <span>Accesos rápidos</span>
                  </div>
                  <div className="dac-quick-grid">
                    <QuickAccessCard title="Preinscripciones"   icon={ClipboardList}   route="/admin/preinscripciones"       color={C.primary} />
                    <QuickAccessCard title="Pagos CUP"          icon={CheckCircle}     route="/admin/pagos-preinscripcion"   color={C.teal}    />
                    <QuickAccessCard title="Grupos CUP"         icon={UsersRound}      route="/grupos-cup"                   color={C.purple}  />
                    <QuickAccessCard title="Asig. Docentes"     icon={UserCheck}       route="/asignacion-docentes"          color={C.indigo}  />
                    <QuickAccessCard title="Evaluaciones"       icon={Layers}          route="/evaluaciones-notas"           color={C.blue}    />
                    <QuickAccessCard title="Admisión"           icon={Trophy}          route="/admisiones-cup"               color={C.green}   />
                    <QuickAccessCard title="Reportes"           icon={BarChart3}       route="/reportes-academicos"          color={C.orange}  />
                    <QuickAccessCard title="Carga Horaria"      icon={CalendarCheck}   route="/carga-horaria-aulas"          color={C.amber}   />
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </main>
    </div>
  );
}
