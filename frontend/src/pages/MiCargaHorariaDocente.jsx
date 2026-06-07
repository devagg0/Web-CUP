import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EstadoCargaHorariaBadge from '../components/EstadoCargaHorariaBadge';
import EstadoAsistenciaBadge from '../components/EstadoAsistenciaBadge';
import RegistrarAsistenciaModal from '../components/RegistrarAsistenciaModal';
import * as service from '../services/cargaHorariaAulas';
import '../styles/cargaHorariaAulas.css';

const extractPayload = (response) => response?.data ?? response ?? {};
const extractList = (response) => {
  const payload = extractPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.cargas_horarias)) return payload.cargas_horarias;
  if (Array.isArray(payload?.cargas)) return payload.cargas;
  if (Array.isArray(payload?.mi_carga_horaria)) return payload.mi_carga_horaria;
  return [];
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getAsignacion = (carga) => carga?.asignacion || carga?.asignacion_docente_grupo || {};
const getGrupo = (carga) => carga?.grupo || getAsignacion(carga)?.grupo || getAsignacion(carga)?.grupo_cup || {};
const getMateria = (carga) => carga?.materia || getAsignacion(carga)?.materia || {};
const getAula = (carga) => carga?.aula || {};
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';
const hora = (value) => String(value || '--:--').slice(0, 5);
const today = () => new Date().toISOString().slice(0, 10);

const hasAttendanceToday = (carga) => {
  if (carga.asistencia_hoy) return true;
  if (Array.isArray(carga.asistencias)) return carga.asistencias.some((asistencia) => asistencia.fecha === today());
  return false;
};

export default function MiCargaHorariaDocente() {
  const [cargas, setCargas] = useState([]);
  const [payload, setPayload] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedCarga, setSelectedCarga] = useState(null);

  const stats = useMemo(() => ({
    total: cargas.length,
    activas: cargas.filter((carga) => String(carga.estado || '').toUpperCase() === 'ACTIVA').length,
    asistenciasHoy: cargas.filter(hasAttendanceToday).length,
  }), [cargas]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await service.getMiCargaHoraria();
      setPayload(extractPayload(response));
      setCargas(extractList(response));
    } catch (e) {
      setError(getBackendError(e, 'No se pudo cargar tu carga horaria.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const registrarAsistencia = async (carga, payloadAsistencia) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    try {
      await service.registrarAsistenciaDocente(carga.id, payloadAsistencia);
      setMessage('Asistencia registrada correctamente.');
      setSelectedCarga(null);
      await loadData();
    } catch (e) {
      setFormError(getBackendError(e, 'No se pudo registrar la asistencia. Ya existe asistencia registrada para esta fecha.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell cu12-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mi carga horaria" breadcrumb="Sistema de Admisión CUP / Mi carga horaria" />

        <div className="content-inner">
          <div className="cu12-heading docente-view-heading">
            <div>
              <h2>Mi carga horaria</h2>
              <p>Consulta tus clases asignadas y registra tu asistencia docente.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={loadData} disabled={loading}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          <div className="stats-row cu12-stats docente-stats">
            <StatCard title="Total clases asignadas" value={payload.total ?? stats.total} accent="#003B73" />
            <StatCard title="Clases activas" value={payload.activas ?? stats.activas} accent="#16A34A" />
            <StatCard title="Asistencias registradas hoy" value={payload.asistencias_hoy ?? stats.asistenciasHoy} accent="#0056B3" />
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? <div className="table-loading">Cargando tu carga horaria...</div> : cargas.length === 0 ? <div className="empty-state">Aun no tienes carga horaria asignada.</div> : (
              <div className="cu12-table-wrapper">
                <table className="cu12-table wide">
                  <thead><tr><th>Grupo</th><th>Materia</th><th>Aula</th><th>Turno</th><th>Dia</th><th>Horario</th><th>Estado</th><th>Asistencia de hoy</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {cargas.map((carga) => {
                      const grupo = getGrupo(carga);
                      const materia = getMateria(carga);
                      const aula = getAula(carga);
                      const asistenciaRegistrada = hasAttendanceToday(carga);
                      return (
                        <tr key={carga.id}>
                          <td><strong>{grupo.codigo || 'Grupo CUP'}</strong><span>{grupo.nombre || 'Grupo'}</span></td>
                          <td>{materiaNombre(materia)}</td>
                          <td>{aula.codigo || aula.nombre || 'Aula'}</td>
                          <td>{carga.turno || 'No registrado'}</td>
                          <td>{carga.dia_semana || 'No registrado'}</td>
                          <td>{hora(carga.hora_inicio)} - {hora(carga.hora_fin)}</td>
                          <td><EstadoCargaHorariaBadge estado={carga.estado} /></td>
                          <td>{asistenciaRegistrada ? <EstadoAsistenciaBadge estado={carga.asistencia_hoy?.estado_asistencia || 'DICTADA'} /> : <span className="soft-label">Pendiente</span>}</td>
                          <td>
                            <button className="btn-primary compact" type="button" onClick={() => { setFormError(''); setSelectedCarga(carga); }} disabled={asistenciaRegistrada || String(carga.estado || '').toUpperCase() !== 'ACTIVA'}>
                              <CalendarCheck size={16} /> Registrar asistencia
                            </button>
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

        <RegistrarAsistenciaModal open={Boolean(selectedCarga)} carga={selectedCarga} saving={saving} backendError={formError} onClose={() => setSelectedCarga(null)} onSubmit={registrarAsistencia} />
      </main>
    </div>
  );
}
