import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  getResumenReportesAcademicos, 
  getReporteAcademico, 
  exportarReporteAcademicoPdf 
} from '../services/reportesAcademicos';
import ReporteTipoSelector from '../components/ReporteTipoSelector';
import ReporteAcademicoTable from '../components/ReporteAcademicoTable';
import { 
  RefreshCw, 
  FileDown, 
  Search, 
  Filter, 
  GraduationCap, 
  Calendar, 
  BookOpen, 
  Layers,
  ArrowLeft
} from 'lucide-react';
import '../styles/reportesAcademicos.css';

export default function ReportesAcademicos() {
  const navigate = useNavigate();

  const handleVolver = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const [selectedType, setSelectedType] = useState('lista_general_postulantes');
  const [resumen, setResumen] = useState(null);
  const [reportData, setReportData] = useState(null);
  
  // Lists for filters
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [carreras, setCarreras] = useState([]);

  // Active filters
  const [search, setSearch] = useState('');
  const [grupoId, setGrupoId] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [estadoAdmision, setEstadoAdmision] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // States
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load summary and option lists on mount
  useEffect(() => {
    const loadMetadata = async () => {
      setMetadataLoading(true);
      try {
        const resumenRes = await getResumenReportesAcademicos();
        setResumen(resumenRes);

        // Fetch options for the filters
        const [carrerasRes, materiasRes, gruposRes] = await Promise.all([
          api.get('/carreras-activas'),
          api.get('/materias-activas'),
          api.get('/admin/grupos-cup')
        ]);

        setCarreras(carrerasRes.data?.data || carrerasRes.data || []);
        setMaterias(materiasRes.data?.data || materiasRes.data || []);
        setGrupos(gruposRes.data?.data || gruposRes.data || []);
      } catch (err) {
        console.error('Error al cargar metadatos de reportes:', err);
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  // Fetch report when type or page changes
  const fetchReport = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        per_page: 100, // as requested: default 100
        search,
        grupo_id: grupoId,
        materia_id: materiaId,
        carrera_id: carreraId,
        estado_admision: estadoAdmision
      };

      const result = await getReporteAcademico(selectedType, params);

      if (selectedType === 'promedios_generales') {
        setReportData(result);
        setCurrentPage(1);
        setLastPage(1);
        setTotalItems(0);
      } else if (result && result.data && Array.isArray(result.data)) {
        setReportData(result.data);
        setCurrentPage(result.current_page || 1);
        setLastPage(result.last_page || 1);
        setTotalItems(result.total || result.data.length);
      } else if (Array.isArray(result)) {
        setReportData(result);
        setCurrentPage(1);
        setLastPage(1);
        setTotalItems(result.length);
      } else if (result && result.paginated && result.paginated.data) {
        // Handle custom groups layout wrapper
        setReportData(result.paginated.data);
        setCurrentPage(result.paginated.current_page || 1);
        setLastPage(result.paginated.last_page || 1);
        setTotalItems(result.paginated.total || result.paginated.data.length);
      } else {
        setReportData(result);
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      setError(err?.response?.data?.message || 'Error al consultar el reporte académico.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(1);
  }, [selectedType]);

  const handleApplyFilters = () => {
    fetchReport(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setGrupoId('');
    setMateriaId('');
    setCarreraId('');
    setEstadoAdmision('');
    
    // We delay slightly to let states clear or just run with cleared params
    setTimeout(() => {
      fetchReport(1);
    }, 50);
  };

  const handleExportPdf = async () => {
    try {
      const params = {
        search,
        grupo_id: grupoId,
        materia_id: materiaId,
        carrera_id: carreraId,
        estado_admision: estadoAdmision
      };
      await exportarReporteAcademicoPdf(selectedType, params);
    } catch (err) {
      console.error(err);
      alert('Error al descargar el archivo PDF.');
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= lastPage) {
      fetchReport(page);
    }
  };

  return (
    <div className="reportes-academicos-page">
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="page-header-simple" style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 6px 0', color: '#003B73' }}>Reportes académicos</h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Consulta reportes del proceso CUP sobre postulantes, notas, grupos, docentes y admisión.
          </p>
        </div>
        <button className="btn-back-action" onClick={handleVolver}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* Summary Cards */}
      {resumen && (
        <div className="resumen-cards-grid" style={{ marginBottom: '24px' }}>
          <div className="resumen-card">
            <span className="card-value">{resumen.total_postulantes}</span>
            <span className="card-label">Total Postulantes</span>
          </div>
          <div className="resumen-card success-border">
            <span className="card-value">{resumen.total_inscritos}</span>
            <span className="card-label">Inscritos</span>
          </div>
          <div className="resumen-card success-border">
            <span className="card-value">{resumen.total_aprobados}</span>
            <span className="card-label">Aprobados</span>
          </div>
          <div className="resumen-card danger-border">
            <span className="card-value">{resumen.total_reprobados}</span>
            <span className="card-label">Reprobados</span>
          </div>
          <div className="resumen-card warning-border">
            <span className="card-value">{resumen.total_pendientes}</span>
            <span className="card-label">Pendientes</span>
          </div>
          <div className="resumen-card info-border">
            <span className="card-value">{resumen.total_grupos_habilitados}</span>
            <span className="card-label">Grupos Habilitados</span>
          </div>
          <div className="resumen-card info-border">
            <span className="card-value">{resumen.promedio_general_cup}</span>
            <span className="card-label">Promedio General</span>
          </div>
          <div className="resumen-card purple-border">
            <span className="card-value">{resumen.total_docentes}</span>
            <span className="card-label">Docentes</span>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="reportes-layout">
        {/* Left Side: Report Selector */}
        <ReporteTipoSelector 
          selectedType={selectedType}
          onSelect={(id) => {
            setSelectedType(id);
            setReportData(null); // Clear data immediately on switch
          }}
        />

        {/* Right Side: Filters and Table results */}
        <div className="report-content-panel">
          {/* Filters Form */}
          <div className="filters-container-box">
            <div className="filters-row">
              {/* Search text field */}
              <div className="filter-item">
                <label>Búsqueda</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Buscar CI, nombre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: '32px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '13px', color: '#64748b' }} />
                </div>
              </div>

              {/* Group dropdown */}
              <div className="filter-item">
                <label>Grupo</label>
                <select value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
                  <option value="">Todos los grupos</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre} ({g.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Materia dropdown */}
              <div className="filter-item">
                <label>Materia</label>
                <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                  <option value="">Todas las materias</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carrera dropdown */}
              <div className="filter-item">
                <label>Carrera</label>
                <select value={carreraId} onChange={(e) => setCarreraId(e.target.value)}>
                  <option value="">Todas las carreras</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado admisión dropdown */}
              {['lista_general_postulantes', 'postulantes_aprobados', 'postulantes_reprobados'].includes(selectedType) && (
                <div className="filter-item">
                  <label>Estado Admisión</label>
                  <select value={estadoAdmision} onChange={(e) => setEstadoAdmision(e.target.value)}>
                    <option value="">Todos los estados</option>
                    <option value="ADMITIDO_PRIMERA_OPCION">Admitido Primera Opción</option>
                    <option value="ADMITIDO_SEGUNDA_OPCION">Admitido Segunda Opción</option>
                    <option value="APROBADO_SIN_CUPO">Aprobado Sin Cupo</option>
                    <option value="REPROBADO">Reprobado</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>
                </div>
              )}
            </div>

            {/* Buttons Row */}
            <div className="actions-row">
              <div className="left-actions">
                <button 
                  className="btn-primary-action" 
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  <Filter size={16} /> Aplicar filtros
                </button>
                <button 
                  className="btn-secondary-action" 
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  Limpiar filtros
                </button>
                <button 
                  className="btn-secondary-action" 
                  onClick={() => fetchReport(currentPage)}
                  disabled={loading}
                  title="Actualizar tabla"
                >
                  <RefreshCw size={16} className={loading ? 'spin-anim' : ''} /> Actualizar
                </button>
              </div>

              <button 
                className="btn-pdf-action" 
                onClick={handleExportPdf}
                disabled={loading || !reportData}
              >
                <FileDown size={16} /> Exportar PDF
              </button>
            </div>
          </div>

          {/* Table display */}
          <div className="report-table-card">
            {error && (
              <div className="error-message-box" style={{ padding: '12px', background: '#fff1f0', border: '1px solid #f5c2c7', color: '#842029', borderRadius: '8px', marginBottom: '16px', textAlign: 'left' }}>
                <strong>Error: </strong> {error}
              </div>
            )}
            
            <ReporteAcademicoTable 
              tipoReporte={selectedType}
              data={reportData}
              loading={loading}
            />

            {/* Pagination Controls */}
            {selectedType !== 'promedios_generales' && lastPage > 1 && !loading && (
              <div className="pagination-controls-row">
                <span>
                  Mostrando página {currentPage} de {lastPage} (Total: {totalItems} registros)
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn-page"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </button>
                  {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => {
                    // Only render if within range to avoid too many buttons
                    if (p === 1 || p === lastPage || Math.abs(p - currentPage) <= 2) {
                      return (
                        <button
                          key={p}
                          className={`btn-page ${currentPage === p ? 'active' : ''}`}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (p === 2 || p === lastPage - 1) {
                      return <span key={p} style={{ margin: '0 4px' }}>...</span>;
                    }
                    return null;
                  })}
                  <button
                    className="btn-page"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
