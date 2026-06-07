import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EstadoAsignacionBadge from '../components/EstadoAsignacionBadge';
import * as asignacionService from '../services/asignacionDocentes';
import '../styles/asignacionDocentes.css';

const extractPayload = (response) => response?.data || response || {};

const extractList = (response) => {
  const payload = extractPayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.grupos)) return payload.grupos;
  if (Array.isArray(payload?.asignaciones)) return payload.asignaciones;
  if (Array.isArray(payload?.mis_grupos)) return payload.mis_grupos;
  return [];
};

const getBackendError = (error, fallback) => {
  const data = error?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || data?.error || fallback;
};

const getGrupo = (item) => item?.grupo || item?.grupo_cup || item?.grupoCup || item;

const getMateria = (item) => item?.materia || item?.materia_habilitada || {};

const getMateriaNombre = (materia) => materia?.nombre || materia?.nombre_materia || materia?.materia || 'Sin materia';

export default function MisGruposAsignadosDocente() {
  const [gruposAsignados, setGruposAsignados] = useState([]);
  const [payload, setPayload] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await asignacionService.getMisGruposAsignadosDocente();
      setPayload(extractPayload(response));
      setGruposAsignados(extractList(response));
    } catch (e) {
      setError(getBackendError(e, 'No se pudieron cargar tus grupos asignados.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const materiaHabilitada = useMemo(() => {
    const explicit = payload?.materia_habilitada || payload?.materia || payload?.docente?.materia_habilitada || payload?.docente?.materia;
    if (explicit) return getMateriaNombre(explicit);

    const firstMateria = getMateria(gruposAsignados[0]);
    return gruposAsignados.length ? getMateriaNombre(firstMateria) : 'No registrada';
  }, [gruposAsignados, payload]);

  return (
    <div className="app-shell asignacion-docentes-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mis grupos asignados" breadcrumb="Sistema de Admisión CUP / Mis grupos asignados" />

        <div className="content-inner">
          <div className="asignacion-heading docente-view-heading">
            <p>Consulta los grupos CUP asignados para tu materia.</p>
            <button className="btn-secondary btn-inline" type="button" onClick={loadData} disabled={loading}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          <div className="stats-row asignacion-stats docente-stats">
            <StatCard title="Total grupos asignados" value={gruposAsignados.length} accent="#003B73" />
            <StatCard title="Materia habilitada" value={materiaHabilitada} accent="#0056B3" />
            <StatCard title="Capacidad máxima permitida" value="4" accent="#16A34A" />
          </div>

          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando grupos asignados...</div>
            ) : gruposAsignados.length === 0 ? (
              <div className="empty-state">Aún no tienes grupos asignados.</div>
            ) : (
              <div className="asignacion-table-wrapper">
                <table className="asignacion-table">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Materia</th>
                      <th>Estudiantes del grupo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruposAsignados.map((item) => {
                      const grupo = getGrupo(item);
                      const materia = getMateria(item);

                      return (
                        <tr key={item.id || grupo.id}>
                          <td><strong>{grupo.codigo || 'Sin codigo'}</strong><span>{grupo.nombre || 'Grupo CUP'}</span></td>
                          <td>{getMateriaNombre(materia)}</td>
                          <td>{grupo.cantidad_estudiantes ?? grupo.estudiantes_count ?? 0}</td>
                          <td><EstadoAsignacionBadge estado={item.estado || 'ACTIVA'} /></td>
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
