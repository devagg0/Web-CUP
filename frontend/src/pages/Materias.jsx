import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import MateriaForm from '../components/MateriaForm';
import MateriasTable from '../components/MateriasTable';
import * as materiasService from '../services/materias';
import '../styles/materias.css';

export default function Materias() {
  const [materias, setMaterias] = useState([]);
  const [resumen, setResumen] = useState({});
  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMaterias = async () => {
    setLoading(true);
    try {
      const response = await materiasService.getMaterias();
      const data = Array.isArray(response) ? response : response.data || response;
      setMaterias(data);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las materias.');
    } finally {
      setLoading(false);
    }
  };

  const loadResumen = async () => {
    try {
      const response = await materiasService.getMateriasResumen();
      const data = response.data || response;
      setResumen(data || {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMaterias();
    loadResumen();
  }, []);

  const filteredMaterias = useMemo(
    () => materias.filter((materia) => {
      const query = filters.search.toLowerCase().trim();
      const matchesSearch =
        !query || materia.nombre?.toLowerCase().includes(query) || materia.codigo?.toLowerCase().includes(query);
      const matchesEstado = !filters.estado || materia.estado === filters.estado;
      return matchesSearch && matchesEstado;
    }),
    [materias, filters],
  );

  const summaryValues = {
    total: resumen.total_materias ?? resumen.total ?? materias.length,
    activas: resumen.materias_activas ?? resumen.activas ?? 0,
    inactivas: resumen.materias_inactivas ?? resumen.inactivas ?? 0,
    habilitadas: resumen.materias_habilitadas ?? resumen.habilitadas ?? 0,
  };

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleCreate = () => {
    clearMessages();
    setEditing(null);
    setDrawerOpen(true);
  };

  const handleEdit = (materia) => {
    clearMessages();
    setEditing(materia);
    setDrawerOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editing?.id) {
        await materiasService.updateMateria(editing.id, payload);
        setMessage('Materia actualizada correctamente.');
      } else {
        await materiasService.createMateria(payload);
        setMessage('Materia creada correctamente.');
      }
      setDrawerOpen(false);
      setEditing(null);
      loadMaterias();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al guardar la materia.');
    }
  };

  const handleToggleEstado = async (materia) => {
    const siguiente = materia.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    try {
      await materiasService.patchMateriaEstado(materia.id, siguiente);
      setMessage(`Materia ${siguiente === 'ACTIVA' ? 'activada' : 'inactivada'} correctamente.`);
      loadMaterias();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al actualizar el estado.');
    }
  };

  const handleDelete = async (materia) => {
    if (!window.confirm(`¿Confirmar desactivar la materia "${materia.nombre}"?`)) {
      return;
    }
    try {
      await materiasService.deleteMateria(materia.id);
      setMessage('Materia desactivada correctamente.');
      loadMaterias();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al desactivar la materia.');
    }
  };

  return (
    <div className="app-shell materias-page">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Materias del CUP" breadcrumb="Sistema de Admisión CUP / Materias del CUP" />

        <div className="content-inner">
          <div className="info-box info-box-large">
            <p>Las materias activas estarán disponibles para procesos académicos futuros.</p>
            <p>Las materias inactivas se mantienen como historial administrativo.</p>
          </div>

          <div className="stats-row">
            <StatCard title="Total materias" value={summaryValues.total} accent="#003B73" />
            <StatCard title="Materias activas" value={summaryValues.activas} accent="#16A34A" />
            <StatCard title="Materias inactivas" value={summaryValues.inactivas} accent="#6B7280" />
            <StatCard title="Habilitadas para asignación" value={summaryValues.habilitadas} accent="#0056B3" />
          </div>

          <div className="controls-row">
            <div className="filters materias-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </label>
              <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
                <option value="">Todos los estados</option>
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
              </select>
              <button className="btn-ghost" type="button" onClick={() => setFilters({ search: '', estado: '' })}>
                Limpiar
              </button>
            </div>
            <button className="btn-primary btn-new" type="button" onClick={handleCreate}>
              <Plus size={16} /> Materia nueva
            </button>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            <div className="table-actions">
              <button className="btn-secondary btn-inline" type="button" onClick={() => { loadMaterias(); loadResumen(); }}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>

            {loading ? (
              <div className="table-loading">Cargando materias...</div>
            ) : (
              <MateriasTable
                materias={filteredMaterias}
                onEdit={handleEdit}
                onToggleEstado={handleToggleEstado}
                onDelete={handleDelete}
              />
            )}
          </div>

          <MateriaForm open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={handleSubmit} initialValues={editing} />
        </div>
      </main>
    </div>
  );
}
