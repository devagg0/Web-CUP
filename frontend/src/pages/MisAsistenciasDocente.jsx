import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EstadoAsistenciaBadge from '../components/EstadoAsistenciaBadge';
import * as service from '../services/cargaHorariaAulas';
import '../styles/cargaHorariaAulas.css';

const extractPayload = (response) => response?.data ?? response ?? {};
const extractList = (response) => {
  const payload = extractPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.asistencias)) return payload.asistencias;
  if (Array.isArray(payload?.mis_asistencias)) return payload.mis_asistencias;
  return [];
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getGrupo = (asistencia) => asistencia?.grupo || asistencia?.carga_horaria?.grupo || asistencia?.carga_horaria?.asignacion?.grupo || {};
const getMateria = (asistencia) => asistencia?.materia || asistencia?.carga_horaria?.materia || asistencia?.carga_horaria?.asignacion?.materia || {};
const getAula = (asistencia) => asistencia?.aula || asistencia?.carga_horaria?.aula || {};
const materiaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';
const hora = (value) => String(value || '--:--').slice(0, 5);
const cleanParams = (filters) => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));

export default function MisAsistenciasDocente() {
  const [asistencias, setAsistencias] = useState([]);
  const [filters, setFilters] = useState({ fecha_desde: '', fecha_hasta: '', estado_asistencia: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const response = await service.getMisAsistenciasDocente(cleanParams(nextFilters));
      setAsistencias(extractList(response));
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar tus asistencias.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    loadData(next);
  };

  return (
    <div className="app-shell cu12-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mis asistencias" breadcrumb="Sistema de Admisión CUP / Mis asistencias" />

        <div className="content-inner">
          <div className="cu12-heading docente-view-heading">
            <div>
              <h2>Mis asistencias</h2>
              <p>Consulta tu historial de clases dictadas, no dictadas o reprogramadas.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={() => loadData()} disabled={loading}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          {error && <div className="message error">{error}</div>}

          <div className="filters cu12-filters asistencia-docente-filters">
            <input type="date" value={filters.fecha_desde} onChange={(event) => handleFilter('fecha_desde', event.target.value)} />
            <input type="date" value={filters.fecha_hasta} onChange={(event) => handleFilter('fecha_hasta', event.target.value)} />
            <select value={filters.estado_asistencia} onChange={(event) => handleFilter('estado_asistencia', event.target.value)}>
              <option value="">Todos</option>
              <option value="DICTADA">DICTADA</option>
              <option value="NO_DICTADA">NO_DICTADA</option>
              <option value="REPROGRAMADA">REPROGRAMADA</option>
            </select>
          </div>

          <div className="card table-card">
            {loading ? <div className="table-loading">Cargando asistencias...</div> : asistencias.length === 0 ? <div className="empty-state">No hay asistencias para mostrar.</div> : (
              <div className="cu12-table-wrapper">
                <table className="cu12-table wide">
                  <thead><tr><th>Fecha</th><th>Grupo</th><th>Materia</th><th>Aula</th><th>Horario</th><th>Estado asistencia</th><th>Observacion</th></tr></thead>
                  <tbody>
                    {asistencias.map((asistencia) => {
                      const grupo = getGrupo(asistencia);
                      const materia = getMateria(asistencia);
                      const aula = getAula(asistencia);
                      const carga = asistencia.carga_horaria || {};
                      return (
                        <tr key={asistencia.id}>
                          <td>{asistencia.fecha || 'No registrada'}</td>
                          <td><strong>{grupo.codigo || 'Grupo CUP'}</strong><span>{grupo.nombre || 'Grupo'}</span></td>
                          <td>{materiaNombre(materia)}</td>
                          <td>{aula.codigo || aula.nombre || 'Aula'}</td>
                          <td>{hora(carga.hora_inicio)} - {hora(carga.hora_fin)}</td>
                          <td><EstadoAsistenciaBadge estado={asistencia.estado_asistencia} /></td>
                          <td className="truncate-cell">{asistencia.observacion || 'Sin observacion'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
