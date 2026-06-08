import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, RefreshCcw } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import EstadoMateriaBadge from '../components/EstadoMateriaBadge';
import NotasPostulanteResumen from '../components/NotasPostulanteResumen';
import * as examenesService from '../services/examenesCup';
import '../styles/examenesCup.css';

const materiasCup = ['Computacion', 'Matematicas', 'Ingles', 'Fisica'];

const normalizeName = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const getMateriaName = (nota) => nota?.materia?.nombre || nota?.materia_nombre || nota?.materia || '';
const getDocenteName = (nota) => (
  nota?.docente?.nombre_completo
  || nota?.docente?.nombre
  || nota?.docente_nombre
  || [nota?.docente?.nombres, nota?.docente?.apellidos].filter(Boolean).join(' ')
  || 'Pendiente'
);
const getGrupoName = (nota) => nota?.grupo?.codigo || nota?.grupo?.nombre || nota?.grupo_nombre || nota?.grupo_codigo || 'Pendiente';

const notaValue = (value) => {
  if (value == null || value === '') return 'Pendiente';
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toFixed(0);
};

const finalValue = (value) => {
  if (value == null || value === '') return 'Pendiente';
  const number = Number(value);
  return Number.isNaN(number) ? value : number.toFixed(2);
};

const calculatePromedio = (notas) => {
  if (notas.length < 4) return null;
  const finales = notas.map((nota) => Number(nota.nota_final)).filter((value) => !Number.isNaN(value));
  if (finales.length < 4) return null;
  return finales.reduce((sum, value) => sum + value, 0) / finales.length;
};

const calculateEstadoCup = (notas, backendEstado) => {
  if (notas.length < 4) return 'PENDIENTE';
  if (backendEstado) return String(backendEstado).toUpperCase();
  const aprobadas = notas.every((nota) => String(nota.estado_materia || nota.estado || '').toUpperCase() === 'APROBADO');
  return aprobadas ? 'APROBADO' : 'REPROBADO';
};

export default function MisNotasCup() {
  const [payload, setPayload] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await examenesService.getMisNotasCup();
      setPayload(examenesService.normalizeMisNotas(response));
    } catch (e) {
      setError(examenesService.getBackendError(e, 'Error al cargar tus notas CUP.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notas = Array.isArray(payload.notas) ? payload.notas : [];
  const promedio = payload.promedio_final_cup ?? payload.promedio_final ?? calculatePromedio(notas);
  const estadoFinal = calculateEstadoCup(notas, payload.estado_final_cup ?? payload.estado_academico_cup);

  const materiasConNotas = useMemo(() => materiasCup.map((materia) => {
    const nota = notas.find((item) => normalizeName(getMateriaName(item)) === normalizeName(materia));
    return { materia, nota };
  }), [notas]);

  return (
    <div className="app-shell examenes-page mis-notas-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Mis notas CUP" breadcrumb="Sistema de Admision CUP / Mis notas" />

        <div className="content-inner">
          <div className="examenes-heading">
            <div>
              <h2>Mis notas CUP</h2>
              <p>Consulta tus calificaciones, promedio y estado academico del Curso Preuniversitario.</p>
            </div>
            <button className="btn-secondary btn-inline" type="button" onClick={loadData} disabled={loading}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          {error && <div className="message error">{error}</div>}

          {loading ? (
            <div className="card table-card">
              <div className="table-loading">Cargando tus notas CUP...</div>
            </div>
          ) : (
            <>
              <NotasPostulanteResumen notas={notas} promedio={promedio} estadoFinal={estadoFinal} />

              <section className="materias-notas-grid">
                {materiasConNotas.map(({ materia, nota }) => (
                  <article className={`materia-nota-card ${nota ? '' : 'pending-card'}`} key={materia}>
                    <div className="materia-card-header">
                      <div>
                        <BookOpenCheck size={20} />
                        <h3>{materia}</h3>
                      </div>
                      {nota ? <EstadoMateriaBadge estado={nota.estado_materia || nota.estado} /> : <EstadoMateriaBadge estado="PENDIENTE" />}
                    </div>

                    {nota ? (
                      <>
                        <div className="materia-scores">
                          <div><span>P1</span><strong>{notaValue(nota.parcial_1)}</strong></div>
                          <div><span>P2</span><strong>{notaValue(nota.parcial_2)}</strong></div>
                          <div><span>P3</span><strong>{notaValue(nota.parcial_3)}</strong></div>
                          <div><span>Final</span><strong>{finalValue(nota.nota_final)}</strong></div>
                        </div>
                        <div className="materia-meta">
                          <span>Docente: <strong>{getDocenteName(nota)}</strong></span>
                          <span>Grupo: <strong>{getGrupoName(nota)}</strong></span>
                        </div>
                      </>
                    ) : (
                      <div className="materia-pending">
                        Materia pendiente de evaluacion.
                      </div>
                    )}
                  </article>
                ))}
              </section>

              <div className="card table-card">
                <div className="notas-table-wrapper">
                  <table className="notas-table compact">
                    <thead>
                      <tr>
                        <th>Materia</th>
                        <th>P1</th>
                        <th>P2</th>
                        <th>P3</th>
                        <th>Final</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiasConNotas.map(({ materia, nota }) => (
                        <tr key={`tabla-${materia}`}>
                          <td><strong>{materia}</strong></td>
                          <td>{nota ? notaValue(nota.parcial_1) : '-'}</td>
                          <td>{nota ? notaValue(nota.parcial_2) : '-'}</td>
                          <td>{nota ? notaValue(nota.parcial_3) : '-'}</td>
                          <td>{nota ? finalValue(nota.nota_final) : 'Pendiente'}</td>
                          <td><EstadoMateriaBadge estado={nota ? nota.estado_materia || nota.estado : 'PENDIENTE'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
