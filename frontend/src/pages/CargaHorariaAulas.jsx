import { useEffect, useMemo, useState } from 'react';
import { Ban, CalendarCheck, DoorOpen, Edit, Eye, PlayCircle, Plus, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EstadoAulaBadge from '../components/EstadoAulaBadge';
import EstadoCargaHorariaBadge from '../components/EstadoCargaHorariaBadge';
import EstadoAsistenciaBadge from '../components/EstadoAsistenciaBadge';
import AulaFormModal from '../components/AulaFormModal';
import AulaDetailModal from '../components/AulaDetailModal';
import CargaHorariaFormModal from '../components/CargaHorariaFormModal';
import CargaHorariaDetailModal from '../components/CargaHorariaDetailModal';
import AsistenciaDocenteDetailModal from '../components/AsistenciaDocenteDetailModal';
import * as service from '../services/cargaHorariaAulas';
import '../styles/cargaHorariaAulas.css';

const manageRoles = ['admin', 'administrador', 'coordinador'];
const TURNOS = ['MAÑANA', 'TARDE', 'NOCHE'];
const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const emptyResumen = {
  total_aulas: 0,
  aulas_activas: 0,
  cargas_activas: 0,
  asistencias_registradas: 0,
};

const extractPayload = (response) => response?.data ?? response ?? {};
const normalizeList = (response) => {
  const payload = extractPayload(response);
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

const getRole = () => {
  try {
    const stored = sessionStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;
    return user?.role?.toLowerCase() || '';
  } catch (e) {
    return '';
  }
};

const cleanParams = (filters) => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
const hora = (value) => String(value || '--:--').slice(0, 5);
const formatDateTime = (value) => {
  if (!value) return 'No registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-BO');
};

const getAsignacion = (carga) => carga?.asignacion || carga?.asignacion_docente_grupo || {};
const getGrupo = (item) => item?.grupo || item?.grupo_cup || item?.carga_horaria?.grupo || getAsignacion(item)?.grupo || getAsignacion(item)?.grupo_cup || item?.carga_horaria?.asignacion?.grupo || {};
const getMateria = (item) => item?.materia || item?.carga_horaria?.materia || getAsignacion(item)?.materia || item?.carga_horaria?.asignacion?.materia || {};
const getDocente = (item) => item?.docente || item?.carga_horaria?.docente || getAsignacion(item)?.docente || item?.carga_horaria?.asignacion?.docente || {};
const getAula = (item) => item?.aula || item?.carga_horaria?.aula || {};
const getUser = (docente) => docente?.user || docente?.usuario || {};
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';
const fullName = (docente) => docente?.nombre_completo || getUser(docente).nombre_completo || [docente?.nombre, docente?.apellidos].filter(Boolean).join(' ') || getUser(docente).name || 'Docente';
const registeredBy = (asistencia) => asistencia?.registrado_por?.name || asistencia?.user?.name || asistencia?.registrado_por || 'No registrado';

export default function CargaHorariaAulas() {
  const [activeTab, setActiveTab] = useState('aulas');
  const [aulas, setAulas] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [resumen, setResumen] = useState(emptyResumen);
  const [aulaFilters, setAulaFilters] = useState({ search: '', estado: '' });
  const [cargaFilters, setCargaFilters] = useState({ grupo_id: '', materia_id: '', docente_id: '', aula_id: '', turno: '', dia_semana: '', estado: '' });
  const [asistenciaFilters, setAsistenciaFilters] = useState({ docente_id: '', estado_asistencia: '', fecha_desde: '', fecha_hasta: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [aulaForm, setAulaForm] = useState({ open: false, aula: null });
  const [cargaForm, setCargaForm] = useState({ open: false, carga: null });
  const [aulaDetail, setAulaDetail] = useState(null);
  const [cargaDetail, setCargaDetail] = useState(null);
  const [asistenciaDetail, setAsistenciaDetail] = useState(null);

  const canManage = manageRoles.includes(getRole());

  const aulaStats = useMemo(() => {
    const activas = aulas.filter((aula) => String(aula.estado || '').toUpperCase() === 'ACTIVA').length;
    return { total: aulas.length, activas, inactivas: aulas.length - activas };
  }, [aulas]);

  const options = useMemo(() => {
    const grupos = new Map();
    const materias = new Map();
    const docentes = new Map();
    const aulasMap = new Map();
    cargas.forEach((carga) => {
      const grupo = getGrupo(carga);
      const materia = getMateria(carga);
      const docente = getDocente(carga);
      const aula = getAula(carga);
      if (grupo.id) grupos.set(grupo.id, grupo);
      if (materia.id) materias.set(materia.id, materia);
      if (docente.id) docentes.set(docente.id, docente);
      if (aula.id) aulasMap.set(aula.id, aula);
    });
    aulas.forEach((aula) => aula.id && aulasMap.set(aula.id, aula));
    asistencias.forEach((asistencia) => {
      const docente = getDocente(asistencia);
      if (docente.id) docentes.set(docente.id, docente);
    });
    return {
      grupos: Array.from(grupos.values()),
      materias: Array.from(materias.values()),
      docentes: Array.from(docentes.values()),
      aulas: Array.from(aulasMap.values()),
    };
  }, [asistencias, aulas, cargas]);

  const loadResumen = async () => {
    const response = await service.getResumenCargaHoraria();
    setResumen({ ...emptyResumen, ...extractPayload(response) });
  };

  const loadAulas = async (filters = aulaFilters) => {
    const response = await service.getAulas(cleanParams(filters));
    setAulas(normalizeList(response));
  };

  const loadCargas = async (filters = cargaFilters) => {
    const response = await service.getCargasHorarias(cleanParams(filters));
    setCargas(normalizeList(response));
  };

  const loadAsistencias = async (filters = asistenciaFilters) => {
    const response = await service.getAsistenciasDocenteAdmin(cleanParams(filters));
    setAsistencias(normalizeList(response));
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadResumen(), loadAulas(), loadCargas(), loadAsistencias()]);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar carga horaria y aulas.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAulaFilter = (field, value) => {
    const next = { ...aulaFilters, [field]: value };
    setAulaFilters(next);
    loadAulas(next).catch((e) => setError(getBackendError(e, 'No se pudieron aplicar los filtros de aulas.')));
  };

  const handleCargaFilter = (field, value) => {
    const next = { ...cargaFilters, [field]: value };
    setCargaFilters(next);
    loadCargas(next).catch((e) => setError(getBackendError(e, 'No se pudieron aplicar los filtros de carga horaria.')));
  };

  const handleAsistenciaFilter = (field, value) => {
    const next = { ...asistenciaFilters, [field]: value };
    setAsistenciaFilters(next);
    loadAsistencias(next).catch((e) => setError(getBackendError(e, 'No se pudieron aplicar los filtros de asistencia.')));
  };

  const saveAula = async (payload) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    try {
      if (aulaForm.aula) {
        await service.actualizarAula(aulaForm.aula.id, payload);
        setMessage('Aula actualizada correctamente.');
      } else {
        await service.crearAula(payload);
        setMessage('Aula creada correctamente.');
      }
      setAulaForm({ open: false, aula: null });
      await Promise.all([loadResumen(), loadAulas()]);
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo guardar el aula.'));
    } finally {
      setSaving(false);
    }
  };

  const saveCarga = async (payload) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    try {
      if (cargaForm.carga) {
        await service.actualizarCargaHoraria(cargaForm.carga.id, payload);
        setMessage('Carga horaria actualizada correctamente.');
      } else {
        await service.crearCargaHoraria(payload);
        setMessage('Carga horaria creada correctamente.');
      }
      setCargaForm({ open: false, carga: null });
      await Promise.all([loadResumen(), loadCargas()]);
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo guardar la carga horaria.'));
    } finally {
      setSaving(false);
    }
  };

  const changeAulaEstado = async (aula) => {
    if (!canManage) return;
    const activa = String(aula.estado || '').toUpperCase() === 'ACTIVA';
    if (!window.confirm(activa ? 'Deseas inactivar esta aula?' : 'Deseas activar esta aula?')) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      if (activa) {
        await service.inactivarAula(aula.id);
        setMessage('Aula inactivada correctamente.');
      } else {
        await service.activarAula(aula.id);
        setMessage('Aula activada correctamente.');
      }
      await Promise.all([loadResumen(), loadAulas()]);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cambiar el estado del aula.'));
    } finally {
      setActionLoading(false);
    }
  };

  const changeCargaEstado = async (carga) => {
    if (!canManage) return;
    const activa = String(carga.estado || '').toUpperCase() === 'ACTIVA';
    if (!window.confirm(activa ? 'Deseas inactivar esta carga horaria?' : 'Deseas activar esta carga horaria?')) return;
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      if (activa) {
        await service.inactivarCargaHoraria(carga.id);
        setMessage('Carga horaria inactivada correctamente.');
      } else {
        await service.activarCargaHoraria(carga.id);
        setMessage('Carga horaria activada correctamente.');
      }
      await Promise.all([loadResumen(), loadCargas()]);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cambiar el estado de la carga horaria.'));
    } finally {
      setActionLoading(false);
    }
  };

  const loadAulaDetail = async (aula) => {
    try {
      const response = await service.getAula(aula.id);
      const payload = extractPayload(response);
      setAulaDetail(payload.aula || payload);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar el detalle del aula.'));
    }
  };

  const loadCargaDetail = async (carga) => {
    try {
      const response = await service.getCargaHoraria(carga.id);
      const payload = extractPayload(response);
      setCargaDetail(payload.carga_horaria || payload.carga || payload);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar el detalle de la carga horaria.'));
    }
  };

  const loadAsistenciaDetail = async (asistencia) => {
    try {
      const response = await service.getAsistenciaDocente(asistencia.id);
      const payload = extractPayload(response);
      setAsistenciaDetail(payload.asistencia || payload.asistencia_docente || payload);
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar el detalle de asistencia.'));
    }
  };

  return (
    <div className="app-shell cu12-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Carga horaria y aulas" breadcrumb="Sistema de Admisión CUP / Carga horaria y aulas" />
        <div className="content-inner">
          <div className="cu12-tabs">
            <button className={activeTab === 'aulas' ? 'active' : ''} type="button" onClick={() => setActiveTab('aulas')}><DoorOpen size={16} /> Aulas</button>
            <button className={activeTab === 'cargas' ? 'active' : ''} type="button" onClick={() => setActiveTab('cargas')}><CalendarCheck size={16} /> Carga horaria</button>
            <button className={activeTab === 'asistencias' ? 'active' : ''} type="button" onClick={() => setActiveTab('asistencias')}><CalendarCheck size={16} /> Asistencia docente</button>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          {activeTab === 'aulas' && (
            <section className="cu12-section">
              <div className="cu12-heading">
                <div>
                  <h2>Aulas</h2>
                  <p>Gestiona aulas habilitadas para la programacion academica.</p>
                </div>
                {canManage && <button className="btn-primary" type="button" onClick={() => { setFormError(''); setAulaForm({ open: true, aula: null }); }}><Plus size={16} /> Nueva aula</button>}
              </div>

              <div className="stats-row cu12-stats">
                <StatCard title="Total aulas" value={aulaStats.total} accent="#003B73" />
                <StatCard title="Aulas activas" value={aulaStats.activas} accent="#16A34A" />
                <StatCard title="Aulas inactivas" value={aulaStats.inactivas} accent="#9CA3AF" />
              </div>

              <div className="controls-row cu12-controls">
                <div className="filters cu12-filters aulas-filters">
                  <input placeholder="Buscar codigo, nombre o ubicacion" value={aulaFilters.search} onChange={(event) => handleAulaFilter('search', event.target.value)} />
                  <select value={aulaFilters.estado} onChange={(event) => handleAulaFilter('estado', event.target.value)}>
                    <option value="">Todas</option>
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="INACTIVA">INACTIVA</option>
                  </select>
                  <button className="btn-secondary" type="button" onClick={loadAll} disabled={loading}><RefreshCcw size={16} /> Actualizar</button>
                </div>
              </div>

              <div className="card table-card">
                {loading ? <div className="table-loading">Cargando aulas...</div> : aulas.length === 0 ? <div className="empty-state">No hay aulas para mostrar.</div> : (
                  <div className="cu12-table-wrapper">
                    <table className="cu12-table">
                      <thead><tr><th>Codigo</th><th>Nombre</th><th>Capacidad</th><th>Ubicacion</th><th>Estado</th><th>Acciones</th></tr></thead>
                      <tbody>
                        {aulas.map((aula) => {
                          const activa = String(aula.estado || '').toUpperCase() === 'ACTIVA';
                          return (
                            <tr key={aula.id}>
                              <td><strong>{aula.codigo || 'Sin codigo'}</strong></td>
                              <td>{aula.nombre || 'Aula'}</td>
                              <td>{aula.capacidad ?? 0}</td>
                              <td>{aula.ubicacion || 'Sin ubicacion'}</td>
                              <td><EstadoAulaBadge estado={aula.estado} /></td>
                              <td><div className="row-actions">
                                <button className="icon-action" type="button" onClick={() => loadAulaDetail(aula)} title="Ver detalle"><Eye size={17} /></button>
                                {canManage && <button className="icon-action" type="button" onClick={() => { setFormError(''); setAulaForm({ open: true, aula }); }} title="Editar"><Edit size={17} /></button>}
                                {canManage && <button className={`icon-action ${activa ? 'danger' : 'success'}`} type="button" onClick={() => changeAulaEstado(aula)} title={activa ? 'Inactivar' : 'Activar'} disabled={actionLoading}>{activa ? <Ban size={17} /> : <PlayCircle size={17} />}</button>}
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'cargas' && (
            <section className="cu12-section">
              <div className="cu12-heading">
                <div>
                  <h2>Carga horaria</h2>
                  <p>Programa clases a partir de asignaciones docente-grupo activas.</p>
                </div>
                {canManage && <button className="btn-primary" type="button" onClick={() => { setFormError(''); setCargaForm({ open: true, carga: null }); }}><Plus size={16} /> Nueva carga horaria</button>}
              </div>

              <div className="stats-row cu12-stats">
                <StatCard title="Total aulas" value={resumen.total_aulas ?? aulaStats.total} accent="#003B73" />
                <StatCard title="Aulas activas" value={resumen.aulas_activas ?? aulaStats.activas} accent="#16A34A" />
                <StatCard title="Cargas activas" value={resumen.cargas_activas ?? 0} accent="#0056B3" />
                <StatCard title="Asistencias registradas" value={resumen.asistencias_registradas ?? 0} accent="#7C3AED" />
              </div>

              <div className="filters cu12-filters cargas-filters">
                <select value={cargaFilters.grupo_id} onChange={(event) => handleCargaFilter('grupo_id', event.target.value)}><option value="">Todos los grupos</option>{options.grupos.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.codigo || 'Grupo'} - {grupo.nombre || 'CUP'}</option>)}</select>
                <select value={cargaFilters.materia_id} onChange={(event) => handleCargaFilter('materia_id', event.target.value)}><option value="">Todas las materias</option>{options.materias.map((materia) => <option key={materia.id} value={materia.id}>{materiaNombre(materia)}</option>)}</select>
                <select value={cargaFilters.docente_id} onChange={(event) => handleCargaFilter('docente_id', event.target.value)}><option value="">Todos los docentes</option>{options.docentes.map((docente) => <option key={docente.id} value={docente.id}>{fullName(docente)}</option>)}</select>
                <select value={cargaFilters.aula_id} onChange={(event) => handleCargaFilter('aula_id', event.target.value)}><option value="">Todas las aulas</option>{options.aulas.map((aula) => <option key={aula.id} value={aula.id}>{aula.codigo || aula.nombre}</option>)}</select>
                <select value={cargaFilters.turno} onChange={(event) => handleCargaFilter('turno', event.target.value)}><option value="">Todos los turnos</option>{TURNOS.map((turno) => <option key={turno} value={turno}>{turno}</option>)}</select>
                <select value={cargaFilters.dia_semana} onChange={(event) => handleCargaFilter('dia_semana', event.target.value)}><option value="">Todos los dias</option>{DIAS.map((dia) => <option key={dia} value={dia}>{dia}</option>)}</select>
                <select value={cargaFilters.estado} onChange={(event) => handleCargaFilter('estado', event.target.value)}><option value="">Todos</option><option value="ACTIVA">ACTIVA</option><option value="INACTIVA">INACTIVA</option></select>
                <button className="btn-secondary" type="button" onClick={loadAll} disabled={loading}><RefreshCcw size={16} /> Actualizar</button>
              </div>

              <div className="card table-card">
                {loading ? <div className="table-loading">Cargando carga horaria...</div> : cargas.length === 0 ? <div className="empty-state">No hay cargas horarias para mostrar.</div> : (
                  <div className="cu12-table-wrapper">
                    <table className="cu12-table wide">
                      <thead><tr><th>Grupo</th><th>Materia</th><th>Docente</th><th>Aula</th><th>Turno</th><th>Dia</th><th>Horario</th><th>Estado</th><th>Acciones</th></tr></thead>
                      <tbody>
                        {cargas.map((carga) => {
                          const grupo = getGrupo(carga);
                          const materia = getMateria(carga);
                          const docente = getDocente(carga);
                          const aula = getAula(carga);
                          const activa = String(carga.estado || '').toUpperCase() === 'ACTIVA';
                          return (
                            <tr key={carga.id}>
                              <td><strong>{grupo.codigo || 'Sin codigo'}</strong><span>{grupo.nombre || 'Grupo CUP'}</span></td>
                              <td>{materiaNombre(materia)}</td>
                              <td>{fullName(docente)}</td>
                              <td>{aula.codigo || aula.nombre || 'Aula'}</td>
                              <td>{carga.turno || 'No registrado'}</td>
                              <td>{carga.dia_semana || 'No registrado'}</td>
                              <td>{hora(carga.hora_inicio)} - {hora(carga.hora_fin)}</td>
                              <td><EstadoCargaHorariaBadge estado={carga.estado} /></td>
                              <td><div className="row-actions">
                                <button className="icon-action" type="button" onClick={() => loadCargaDetail(carga)} title="Ver detalle"><Eye size={17} /></button>
                                {canManage && <button className="icon-action" type="button" onClick={() => { setFormError(''); setCargaForm({ open: true, carga }); }} title="Editar"><Edit size={17} /></button>}
                                {canManage && <button className={`icon-action ${activa ? 'danger' : 'success'}`} type="button" onClick={() => changeCargaEstado(carga)} title={activa ? 'Inactivar' : 'Activar'} disabled={actionLoading}>{activa ? <Ban size={17} /> : <PlayCircle size={17} />}</button>}
                              </div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'asistencias' && (
            <section className="cu12-section">
              <div className="cu12-heading"><div><h2>Asistencia docente</h2><p>Consulta asistencias registradas por docentes sobre su carga horaria.</p></div></div>
              <div className="filters cu12-filters asistencia-filters">
                <select value={asistenciaFilters.docente_id} onChange={(event) => handleAsistenciaFilter('docente_id', event.target.value)}><option value="">Todos los docentes</option>{options.docentes.map((docente) => <option key={docente.id} value={docente.id}>{fullName(docente)}</option>)}</select>
                <select value={asistenciaFilters.estado_asistencia} onChange={(event) => handleAsistenciaFilter('estado_asistencia', event.target.value)}><option value="">Todos</option><option value="DICTADA">DICTADA</option><option value="NO_DICTADA">NO_DICTADA</option><option value="REPROGRAMADA">REPROGRAMADA</option></select>
                <input type="date" value={asistenciaFilters.fecha_desde} onChange={(event) => handleAsistenciaFilter('fecha_desde', event.target.value)} />
                <input type="date" value={asistenciaFilters.fecha_hasta} onChange={(event) => handleAsistenciaFilter('fecha_hasta', event.target.value)} />
                <button className="btn-secondary" type="button" onClick={loadAll} disabled={loading}><RefreshCcw size={16} /> Actualizar</button>
              </div>

              <div className="card table-card">
                {loading ? <div className="table-loading">Cargando asistencias...</div> : asistencias.length === 0 ? <div className="empty-state">No hay asistencias para mostrar.</div> : (
                  <div className="cu12-table-wrapper">
                    <table className="cu12-table wide">
                      <thead><tr><th>Docente</th><th>Grupo</th><th>Materia</th><th>Aula</th><th>Fecha</th><th>Estado asistencia</th><th>Observacion</th><th>Registrado por</th><th>Fecha registro</th><th>Acciones</th></tr></thead>
                      <tbody>
                        {asistencias.map((asistencia) => {
                          const docente = getDocente(asistencia);
                          const grupo = getGrupo(asistencia);
                          const materia = getMateria(asistencia);
                          const aula = getAula(asistencia);
                          return (
                            <tr key={asistencia.id}>
                              <td>{fullName(docente)}</td>
                              <td>{grupo.codigo || 'Grupo CUP'}</td>
                              <td>{materiaNombre(materia)}</td>
                              <td>{aula.codigo || aula.nombre || 'Aula'}</td>
                              <td>{asistencia.fecha || 'No registrada'}</td>
                              <td><EstadoAsistenciaBadge estado={asistencia.estado_asistencia} /></td>
                              <td className="truncate-cell">{asistencia.observacion || 'Sin observacion'}</td>
                              <td>{registeredBy(asistencia)}</td>
                              <td>{formatDateTime(asistencia.created_at || asistencia.fecha_registro)}</td>
                              <td><button className="icon-action" type="button" onClick={() => loadAsistenciaDetail(asistencia)} title="Ver detalle"><Eye size={17} /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <AulaFormModal open={aulaForm.open} aula={aulaForm.aula} saving={saving} backendError={formError} onClose={() => setAulaForm({ open: false, aula: null })} onSubmit={saveAula} />
        <AulaDetailModal aula={aulaDetail} onClose={() => setAulaDetail(null)} />
        <CargaHorariaFormModal open={cargaForm.open} carga={cargaForm.carga} saving={saving} backendError={formError} onClose={() => setCargaForm({ open: false, carga: null })} onSubmit={saveCarga} />
        <CargaHorariaDetailModal carga={cargaDetail} onClose={() => setCargaDetail(null)} />
        <AsistenciaDocenteDetailModal asistencia={asistenciaDetail} onClose={() => setAsistenciaDetail(null)} />
      </main>
    </div>
  );
}
