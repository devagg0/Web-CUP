import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, PlusCircle, RefreshCcw, Search, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ImportarNotasCupModal from '../components/ImportarNotasCupModal';
import NotaCupDetailModal from '../components/NotaCupDetailModal';
import NotaCupFormModal from '../components/NotaCupFormModal';
import NotasCupTable from '../components/NotasCupTable';
import * as examenesService from '../services/examenesCup';
import * as gruposCupService from '../services/gruposCup';
import * as materiasService from '../services/materias';
import * as docentesService from '../services/docentes';
import * as asignacionDocentesService from '../services/asignacionDocentes';
import '../styles/examenesCup.css';

const managementRoles = ['admin', 'administrador', 'coordinador', 'docente'];
const importRoles = ['admin', 'administrador', 'coordinador'];

const emptyResumen = {
  total_registros: 0,
  postulantes_evaluados: 0,
  materias_evaluadas: 0,
  aprobados: 0,
  reprobados: 0,
  pendientes: 0,
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

const normalizeText = (value) => String(value || '').toLowerCase();

const getDocenteLabel = (docente) => {
  if (!docente) return 'Docente no asignado';
  return (
    docente.nombre ??
    docente.nombre_usuario ??
    docente.nombre_completo ??
    docente.user?.name ??
    docente.user?.nombre ??
    docente.correo_usuario ??
    docente.correo ??
    `Docente ${docente.id ?? ''}`
  );
};

const getPostulanteSearch = (nota) => [
  nota?.postulante?.nombre_completo,
  nota?.postulante?.nombre,
  nota?.postulante_nombre,
  nota?.postulante?.nombres,
  nota?.postulante?.apellidos,
  nota?.postulante?.ci,
  nota?.postulante_ci,
  nota?.ci,
].filter(Boolean).join(' ');

const getResumenFallback = (notas) => {
  const postulantes = new Set();
  const materias = new Set();
  let aprobados = 0;
  let reprobados = 0;
  let pendientes = 0;

  notas.forEach((nota) => {
    const postulanteKey = nota.postulante_id || nota.postulante?.id || nota.ci || nota.postulante_ci;
    const materiaKey = nota.materia_id || nota.materia?.id || nota.materia || nota.materia_nombre;
    if (postulanteKey) postulantes.add(postulanteKey);
    if (materiaKey) materias.add(materiaKey);

    const estado = String(nota.estado_materia || nota.estado || 'PENDIENTE').toUpperCase();
    if (estado === 'APROBADO') aprobados += 1;
    else if (estado === 'REPROBADO') reprobados += 1;
    else pendientes += 1;
  });

  return {
    total_registros: notas.length,
    postulantes_evaluados: postulantes.size,
    materias_evaluadas: materias.size,
    aprobados,
    reprobados,
    pendientes,
  };
};

export default function EvaluacionesNotas() {
  const [resumen, setResumen] = useState(emptyResumen);
  const [notas, setNotas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [filters, setFilters] = useState({ search: '', grupo_id: '', materia_id: '', docente_id: '', estado_materia: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [importError, setImportError] = useState('');
  const [detailNota, setDetailNota] = useState(null);
  const [editingNota, setEditingNota] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const role = getRole();
  const canManage = managementRoles.includes(role);
  const canImport = importRoles.includes(role);

  const loadCatalogs = useCallback(async () => {
    const userRole = getRole();
    if (userRole === 'docente') {
      try {
        const [profileResponse, assignmentsResponse] = await Promise.all([
          docentesService.obtenerMiPerfilDocente(),
          asignacionDocentesService.getMisGruposAsignadosDocente()
        ]);
        
        // Parse profile
        const profile = profileResponse.data || profileResponse;
        const currentDocente = profile.docente || profile;
        const docId = currentDocente?.id;
        
        if (currentDocente) {
          setDocentes([currentDocente]);
        }
        
        // Parse assignments
        const assignmentsData = assignmentsResponse.data || assignmentsResponse;
        const list = Array.isArray(assignmentsData) ? assignmentsData : (assignmentsData?.data || []);
        
        // Extract unique groups and materias
        const extractedGroups = [];
        const extractedMaterias = [];
        const groupIds = new Set();
        const materiaIds = new Set();
        
        list.forEach(item => {
          if (item.grupo && !groupIds.has(item.grupo.id)) {
            groupIds.add(item.grupo.id);
            extractedGroups.push(item.grupo);
          }
          if (item.materia && !materiaIds.has(item.materia.id)) {
            materiaIds.add(item.materia.id);
            extractedMaterias.push(item.materia);
          }
        });
        
        setGrupos(extractedGroups);
        setMaterias(extractedMaterias);
        
        if (docId) {
          setFilters(prev => ({
            ...prev,
            docente_id: String(docId)
          }));
        }
      } catch (err) {
        console.error('Error loading catalogs for docente:', err);
      }
    } else {
      const [gruposResponse, materiasResponse, docentesResponse] = await Promise.allSettled([
        gruposCupService.getGruposCup(),
        materiasService.getMateriasActivas ? materiasService.getMateriasActivas() : materiasService.getMaterias(),
        docentesService.obtenerDocentesHabilitados ? docentesService.obtenerDocentesHabilitados() : docentesService.listarDocentes(),
      ]);

      if (gruposResponse.status === 'fulfilled') setGrupos(examenesService.normalizeList(gruposResponse.value));
      if (materiasResponse.status === 'fulfilled') setMaterias(examenesService.normalizeList(materiasResponse.value));
      if (docentesResponse.status === 'fulfilled') setDocentes(examenesService.normalizeList(docentesResponse.value));
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        grupo_id: filters.grupo_id || undefined,
        materia_id: filters.materia_id || undefined,
        docente_id: filters.docente_id || undefined,
        estado_materia: filters.estado_materia || undefined,
        ci: filters.search.trim() || undefined,
      };

      const [resumenResponse, notasResponse] = await Promise.all([
        examenesService.getResumenExamenesCup(params).catch(() => null),
        examenesService.getExamenesCup(params),
      ]);

      const loadedNotas = examenesService.normalizeList(notasResponse);
      setNotas(loadedNotas);
      const backendResumen = examenesService.normalizePayload(resumenResponse);
      setResumen({ ...emptyResumen, ...getResumenFallback(loadedNotas), ...backendResumen });
    } catch (e) {
      setError(examenesService.getBackendError(e, 'Error al cargar evaluaciones y notas.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredNotas = useMemo(() => {
    let result = notas;
    
    // 1. Filter by search query
    const query = normalizeText(filters.search);
    if (query) {
      result = result.filter((nota) => normalizeText(getPostulanteSearch(nota)).includes(query));
    }

    // 2. Filter by estado_materia
    const selectedEstado = filters.estado_materia || 'TODOS';
    if (selectedEstado !== 'TODOS' && selectedEstado !== '') {
      result = result.filter((nota) => {
        const estadoRegistro = (nota.estado_materia ?? nota.estado ?? '').toUpperCase();
        return estadoRegistro === selectedEstado.toUpperCase();
      });
    }

    return result;
  }, [notas, filters.search, filters.estado_materia]);

  const clearFilters = () => {
    const userRole = getRole();
    if (userRole === 'docente') {
      const docId = docentes.length > 0 ? docentes[0].id : '';
      setFilters({ search: '', grupo_id: '', materia_id: '', docente_id: docId ? String(docId) : '', estado_materia: '' });
    } else {
      setFilters({ search: '', grupo_id: '', materia_id: '', docente_id: '', estado_materia: '' });
    }
  };

  const handleOpenCreate = () => {
    setEditingNota(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveNota = async (payload) => {
    setSaving(true);
    setFormError('');
    setMessage('');
    try {
      if (editingNota?.id) {
        await examenesService.actualizarNotaCup(editingNota.id, payload);
        setMessage('Nota actualizada correctamente.');
      } else {
        await examenesService.registrarNotaCup(payload);
        setMessage('Nota registrada correctamente.');
      }
      setIsFormOpen(false);
      setEditingNota(null);
      await loadData();
    } catch (e) {
      setFormError(examenesService.getBackendError(e, 'No se pudo guardar la nota.'));
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (formData) => {
    setImporting(true);
    setImportError('');
    setImportResult(null);
    setMessage('');
    try {
      const response = await examenesService.importarNotasCup(formData);
      setImportResult(response);
      setMessage(response?.message || 'Importacion completada.');
      await loadData();
    } catch (e) {
      setImportError(examenesService.getBackendError(e, 'No se pudo importar el archivo.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="app-shell examenes-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Evaluaciones y notas CUP" breadcrumb="Sistema de Admision CUP / Evaluaciones y notas" />

        <div className="content-inner">
          <div className="examenes-heading">
            <div>
              <h2>Evaluaciones y notas CUP</h2>
              <p>Registra, importa y consulta las notas de los postulantes en las materias del CUP.</p>
            </div>
            <div className="heading-actions">
              <button className="btn-secondary btn-inline" type="button" onClick={loadData} disabled={loading}>
                <RefreshCcw size={16} /> Actualizar
              </button>
              {canManage && (
                <button className="btn-primary btn-inline" type="button" onClick={handleOpenCreate}>
                  <PlusCircle size={16} /> Nueva nota
                </button>
              )}
              {canImport && (
                <button className="btn-secondary btn-inline" type="button" onClick={() => setIsImportOpen(true)}>
                  <FileSpreadsheet size={16} /> Importar CSV
                </button>
              )}
            </div>
          </div>

          <div className="stats-row examenes-stats">
            <StatCard title="Total registros" value={resumen.total_registros ?? resumen.total ?? 0} accent="#003B73" />
            <StatCard title="Postulantes evaluados" value={resumen.postulantes_evaluados ?? 0} accent="#0056B3" />
            <StatCard title="Materias evaluadas" value={resumen.materias_evaluadas ?? 0} accent="#0F766E" />
            <StatCard title="Aprobados" value={resumen.aprobados ?? 0} accent="#16A34A" />
            <StatCard title="Reprobados" value={resumen.reprobados ?? 0} accent="#DC2626" />
            <StatCard title="Pendientes" value={resumen.pendientes ?? 0} accent="#D97706" />
          </div>

          <div className="controls-row examenes-controls">
            <div className="filters examenes-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por CI o nombre del postulante"
                  value={filters.search}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                />
              </label>
              <select value={filters.grupo_id} onChange={(event) => setFilters({ ...filters, grupo_id: event.target.value })}>
                <option value="">Todos los grupos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>{grupo.codigo || grupo.nombre || `Grupo ${grupo.id}`}</option>
                ))}
              </select>
              <select value={filters.materia_id} onChange={(event) => setFilters({ ...filters, materia_id: event.target.value })}>
                <option value="">Todas las materias</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>{materia.nombre || `Materia ${materia.id}`}</option>
                ))}
              </select>
              <select 
                value={filters.docente_id} 
                onChange={(event) => setFilters({ ...filters, docente_id: event.target.value })}
                disabled={role === 'docente'}
              >
                {role === 'docente' ? null : <option value="">Todos los docentes</option>}
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {getDocenteLabel(docente)}
                  </option>
                ))}
              </select>
              <select value={filters.estado_materia} onChange={(event) => setFilters({ ...filters, estado_materia: event.target.value })}>
                <option value="TODOS">Todos los estados</option>
                <option value="APROBADO">Aprobado</option>
                <option value="REPROBADO">Reprobado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
              <button className="btn-ghost btn-inline" type="button" onClick={clearFilters}>
                <XCircle size={16} /> Limpiar
              </button>
            </div>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            {loading ? (
              <div className="table-loading">Cargando evaluaciones CUP...</div>
            ) : (
              <NotasCupTable
                notas={filteredNotas}
                canEdit={canManage}
                onView={setDetailNota}
                onEdit={(nota) => {
                  setEditingNota(nota);
                  setFormError('');
                  setIsFormOpen(true);
                }}
              />
            )}
          </div>
        </div>

        <NotaCupDetailModal nota={detailNota} onClose={() => setDetailNota(null)} />
        <NotaCupFormModal
          open={isFormOpen}
          nota={editingNota}
          grupos={grupos}
          materias={materias}
          docentes={docentes}
          saving={saving}
          error={formError}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSaveNota}
        />
        <ImportarNotasCupModal
          open={isImportOpen}
          importing={importing}
          error={importError}
          result={importResult}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImport}
        />
      </main>
    </div>
  );
}
