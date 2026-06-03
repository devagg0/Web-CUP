import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import CarreraForm from '../components/CarreraForm';
import CarrerasTable from '../components/CarrerasTable';
import * as carrerasService from '../services/carreras';
import '../styles/usuarios.css';
import '../styles/carreras.css';

export default function Carreras() {
  const [carreras, setCarreras] = useState([]);
  const [resumen, setResumen] = useState({ total_carreras: 0, carreras_activas: 0, cupos_totales: 0, cupos_disponibles: 0 });
  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadCarreras = async () => {
    setLoading(true);
    try {
      const response = await carrerasService.getCarreras();
      const data = response.data || response;
      setCarreras(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las carreras.');
    } finally {
      setLoading(false);
    }
  };

  const loadResumen = async () => {
    try {
      const response = await carrerasService.getCarrerasResumen();
      const data = response.data || response;
      setResumen(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCarreras();
    loadResumen();
  }, []);

  const filteredCarreras = useMemo(
    () => carreras.filter((carrera) => {
      const searchValue = filters.search.toLowerCase().trim();
      const matchesSearch = !searchValue || carrera.nombre.toLowerCase().includes(searchValue);
      const matchesEstado = !filters.estado || carrera.estado === filters.estado;
      return matchesSearch && matchesEstado;
    }),
    [carreras, filters],
  );

  const totals = useMemo(() => ({
    totalCarreras: resumen.total_carreras ?? 0,
    activas: resumen.carreras_activas ?? 0,
    cuposTotales: resumen.cupos_totales ?? 0,
    cuposDisponibles: resumen.cupos_disponibles ?? 0,
  }), [resumen]);

  const clearMessages = () => {
    setMessage('');
    setError('');
  };

  const handleCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
    clearMessages();
  };

  const handleEdit = (carrera) => {
    setEditing(carrera);
    setDrawerOpen(true);
    clearMessages();
  };

  const handleSubmit = async (payload) => {
    try {
      if (editing && editing.id) {
        await carrerasService.updateCarrera(editing.id, payload);
        setMessage('Carrera actualizada correctamente.');
      } else {
        await carrerasService.createCarrera(payload);
        setMessage('Carrera creada correctamente.');
      }
      setDrawerOpen(false);
      setEditing(null);
      loadCarreras();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al guardar la carrera.');
    }
  };

  const handleToggleEstado = async (carrera) => {
    const siguiente = carrera.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    try {
      await carrerasService.patchCarreraEstado(carrera.id, siguiente);
      setMessage(`Carrera ${siguiente === 'ACTIVA' ? 'activada' : 'inactivada'} correctamente.`);
      loadCarreras();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al actualizar el estado.');
    }
  };

  const handleDelete = async (carrera) => {
    if (!window.confirm(`¿Confirmar desactivar la carrera "${carrera.nombre}"?`)) {
      return;
    }
    try {
      await carrerasService.deleteCarrera(carrera.id);
      setMessage('Carrera desactivada correctamente.');
      loadCarreras();
      loadResumen();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al desactivar la carrera.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Carreras y Cupos" breadcrumb="Sistema de Admisión CUP / Carreras y Cupos" />

        <div className="content-inner">
          <div className="info-box info-box-large">
            <p>Las carreras pueden ser activadas o inactivadas según corresponda.</p>
            <p>Los cupos pueden ser editados según lo definido por la facultad.</p>
          </div>

          <div className="stats-row">
            <StatCard title="Total carreras" value={totals.totalCarreras} accent="#003B73" />
            <StatCard title="Carreras activas" value={totals.activas} accent="#16A34A" />
            <StatCard title="Cupos totales" value={totals.cuposTotales} accent="#0056B3" />
            <StatCard title="Cupos disponibles" value={totals.cuposDisponibles} accent="#16A34A" />
          </div>

          <div className="controls-row">
            <div className="filters carrera-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nombre de carrera"
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
              <Plus size={16} /> Nueva carrera
            </button>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <div className="card table-card">
            <div className="table-actions">
              <button className="btn-secondary btn-inline" type="button" onClick={loadCarreras}>
                <RefreshCcw size={16} /> Actualizar
              </button>
            </div>
            {loading ? (
              <div className="table-loading">Cargando carreras...</div>
            ) : (
              <CarrerasTable
                carreras={filteredCarreras}
                onEdit={handleEdit}
                onToggleEstado={handleToggleEstado}
                onDelete={handleDelete}
              />
            )}
          </div>

          <CarreraForm open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={handleSubmit} initialValues={editing} />
        </div>
      </main>
    </div>
  );
}
