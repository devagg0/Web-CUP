import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Grid2X2, List, RefreshCcw, UsersRound } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import GrupoHorarioCard from '../components/GrupoHorarioCard';
import GrupoHorarioTable from '../components/GrupoHorarioTable';
import { getMiGrupoHorario } from '../services/grupoHorario';
import '../styles/grupoHorario.css';

const dayOrder = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
  domingo: 7,
};

const extractPayload = (response) => response?.data ?? response ?? {};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const clean = (value, fallback = 'No registrado') => first(value, fallback);
const hour = (value) => String(value || '--:--').slice(0, 5);
const normalizeTextKey = (value) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getMateria = (row) => row?.materia || row?.asignacion?.materia || row?.asignacion_docente_grupo?.materia || {};
const getDocente = (row) => row?.docente || row?.asignacion?.docente || row?.asignacion_docente_grupo?.docente || {};
const getAula = (row) => row?.aula || {};

const docenteNombre = (docente) => {
  const nombreCompleto = [docente?.nombres, docente?.apellidos].filter(Boolean).join(' ');
  return first(docente?.nombre_completo, docente?.nombre, docente?.name, nombreCompleto, docente?.usuario?.name, 'Docente por confirmar');
};

const normalizeItem = (row, index) => {
  const materia = getMateria(row);
  const docente = getDocente(row);
  const aula = getAula(row);
  const turno = clean(row?.turno, 'Turno pendiente');
  const dia = clean(row?.dia_semana || row?.dia || row?.day, 'Día pendiente');
  const horaInicio = hour(row?.hora_inicio || row?.inicio || row?.horaInicio);
  const horaFin = hour(row?.hora_fin || row?.fin || row?.horaFin);

  const details = [
    ['Código de materia', materia?.codigo || row?.codigo_materia],
    ['Periodo', row?.periodo || row?.gestion],
    ['Estado', row?.estado || row?.estado_carga],
    ['Observaciones', row?.observaciones || row?.descripcion || row?.detalle],
  ].filter(([, value]) => value).map(([label, value]) => ({ label, value }));

  return {
    id: String(first(row?.id, row?.carga_horaria_id, row?.asignacion_id, `${dia}-${horaInicio}-${index}`)),
    dia,
    diaKey: normalizeTextKey(dia),
    materia: clean(materia?.nombre || materia?.nombre_materia || row?.materia || row?.nombre_materia, 'Materia pendiente'),
    docente: docenteNombre(docente),
    aula: clean(aula?.codigo || aula?.nombre || row?.aula || row?.nombre_aula, 'Aula por confirmar'),
    turno,
    turnoKey: normalizeTextKey(turno),
    horaInicio,
    horaFin,
    detalles: details,
  };
};

const sortHorario = (items) => [...items].sort((a, b) => {
  const dayA = dayOrder[a.diaKey] || 99;
  const dayB = dayOrder[b.diaKey] || 99;
  if (dayA !== dayB) return dayA - dayB;
  return a.horaInicio.localeCompare(b.horaInicio);
});

export default function ConsultarGrupoHorario() {
  const [items, setItems] = useState([]);
  const [grupo, setGrupo] = useState(null);
  const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMiGrupoHorario();
      const payload = extractPayload(response);
      const horario = Array.isArray(payload?.horario) ? payload.horario : [];
      setGrupo(payload?.grupo ?? null);
      setResumen(payload?.resumen ?? {});
      setItems(sortHorario(horario.map(normalizeItem)));
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar tu grupo y horario asignado.'));
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

  const totals = useMemo(() => {
    const materias = new Set(items.map((item) => item.materia).filter(Boolean));
    const turnos = new Set(items.map((item) => item.turno).filter(Boolean));
    return {
      bloques: resumen.total ?? resumen.total_bloques ?? items.length,
      materias: resumen.total_materias ?? materias.size,
      turnos: resumen.total_turnos ?? turnos.size,
    };
  }, [items, resumen]);

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="app-shell grupo-horario-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mi horario" breadcrumb="Sistema de Admisión CUP / Mi horario" />

        <div className="content-inner">
          <section className="grupo-heading">
            <div className="grupo-heading-copy">
              <span><CalendarDays size={17} /> CU13</span>
              <h2>Grupo y horario asignado</h2>
              <p>Consulta tus materias, aulas, docentes y turnos registrados para el CUP.</p>
            </div>
            <div className="grupo-heading-actions">
              <div className="grupo-view-toggle" aria-label="Cambiar vista">
                <button type="button" className={viewMode === 'cards' ? 'active' : ''} onClick={() => setViewMode('cards')}>
                  <Grid2X2 size={16} /> Tarjetas
                </button>
                <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                  <List size={16} /> Tabla
                </button>
              </div>
              <button className="grupo-refresh" type="button" onClick={loadData} disabled={loading}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>
          </section>

          <div className="stats-row grupo-stats">
            <StatCard title="Bloques de horario" value={totals.bloques} accent="#003B73" />
            <StatCard title="Materias" value={totals.materias} accent="#F97316" />
            <StatCard title="Turnos" value={totals.turnos} accent="#7C3AED" />
          </div>

          {error && <div className="grupo-message error">{error}</div>}

          {grupo && (
            <section className="grupo-principal-card">
              <div className="grupo-principal-icon">
                <UsersRound size={28} />
              </div>
              <div className="grupo-principal-copy">
                <span>Grupo asignado</span>
                <h3>{clean(grupo.codigo, 'Sin código')} - {clean(grupo.nombre, 'Sin nombre')}</h3>
                <p>{grupo.cantidad_estudiantes ?? 0} estudiantes</p>
              </div>
              <div className="grupo-principal-status">
                <span>Estado</span>
                <strong>{clean(grupo.estado, 'SIN ESTADO')}</strong>
              </div>
            </section>
          )}

          <section className="grupo-content">
            {loading ? (
              <div className="grupo-empty">Cargando tu horario asignado...</div>
            ) : items.length === 0 ? (
              <div className="grupo-empty">Tu grupo aún no tiene horario asignado.</div>
            ) : viewMode === 'cards' ? (
              <div className="grupo-card-grid">
                {items.map((item) => (
                  <GrupoHorarioCard
                    key={item.id}
                    item={item}
                    expanded={expandedIds.has(item.id)}
                    onToggle={() => toggleExpanded(item.id)}
                  />
                ))}
              </div>
            ) : (
              <GrupoHorarioTable items={items} expandedIds={expandedIds} onToggle={toggleExpanded} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
