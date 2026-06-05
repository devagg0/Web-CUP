import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PreinscripcionesTable from '../components/PreinscripcionesTable';
import PreinscripcionDetailModal from '../components/PreinscripcionDetailModal';
import * as preinscripcionService from '../services/preinscripcion';
import '../styles/adminPreinscripciones.css';

export default function AdminPreinscripciones() {
  const [preinscripciones, setPreinscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const loadPreinscripciones = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await preinscripcionService.getAdminPreinscripciones();
      const data = response.data || response;
      setPreinscripciones(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      setMessage('No se pudieron cargar las preinscripciones. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreinscripciones();
  }, []);

  const filteredPreinscripciones = useMemo(() => {
    return preinscripciones.filter((item) => {
      const searchValue = filterText.toLowerCase().trim();
      const matchesSearch =
        !searchValue ||
        [item.ci, item.nombres, item.apellidos, item.correo]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(searchValue));
      const matchesEstado = !filterEstado || item.estado === filterEstado;
      return matchesSearch && matchesEstado;
    });
  }, [preinscripciones, filterText, filterEstado]);

  const stats = useMemo(() => {
    const total = preinscripciones.length;
    const enRevision = preinscripciones.filter((item) => item.estado === 'EN_REVISION_REQUISITOS').length;
    const requisitosObservados = preinscripciones.filter((item) => item.estado === 'REQUISITOS_OBSERVADOS').length;
    const pagoHabilitado = preinscripciones.filter((item) => item.estado === 'PAGO_HABILITADO').length;
    const pagoEnRevision = preinscripciones.filter((item) => item.estado === 'PAGO_EN_REVISION').length;
    const pagoObservado = preinscripciones.filter((item) => item.estado === 'PAGO_OBSERVADO').length;
    const inscritos = preinscripciones.filter((item) => item.estado === 'INSCRITO').length;
    const rechazados = preinscripciones.filter((item) => item.estado === 'RECHAZADO').length;
    return { total, enRevision, requisitosObservados, pagoHabilitado, pagoEnRevision, pagoObservado, inscritos, rechazados };
  }, [preinscripciones]);

  const openDetail = (item) => {
    setSelected(item);
    setModalOpen(true);
  };

  const closeDetail = () => {
    setModalOpen(false);
    setSelected(null);
  };

  const handleApproveRequirements = async (item) => {
    try {
      const response = await preinscripcionService.aprobarRequisitos(item.id);
      const data = response.data || response;
      setMessage('Requisitos aprobados correctamente.');
      if (data.registro || data.password_temporal || data.contrasena_temporal) {
        setSelected({ ...item, approvalInfo: data });
      }
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al aprobar los requisitos. Intenta de nuevo.');
    }
  };

  const handleApprovePayment = async (item) => {
    try {
      const response = await preinscripcionService.aprobarPago(item.id);
      const data = response.data || response;
      setMessage('Pago aprobado. Usuario postulante generado correctamente.');
      if (data.registro || data.password_temporal || data.contrasena_temporal) {
        setSelected({ ...item, approvalInfo: data });
      }
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al aprobar el pago. Intenta de nuevo.');
    }
  };

  const handleObserveRequirements = async (item, observacion) => {
    try {
      await preinscripcionService.observarRequisitos(item.id, observacion);
      setMessage('Requisitos observados. El postulante será notificado.');
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al observar los requisitos. Intenta de nuevo.');
    }
  };

  const handleObservePayment = async (item, observacion) => {
    try {
      await preinscripcionService.observarPago(item.id, observacion);
      setMessage('Pago observado. El postulante será notificado.');
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al observar el pago. Intenta de nuevo.');
    }
  };

  const handleReject = async (item, observacion) => {
    try {
      await preinscripcionService.rechazarPreinscripcion(item.id, observacion);
      setMessage('Preinscripción rechazada correctamente.');
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al rechazar la preinscripción. Intenta de nuevo.');
    }
  };

  const requestObserve = async (item) => {
    const observacion = window.prompt('Motivo de observación');
    if (!observacion?.trim()) return;
    const estado = String(item.estado || item.status || '').toUpperCase();
    if (['EN_REVISION_REQUISITOS', 'REQUISITOS_OBSERVADOS'].includes(estado)) {
      await handleObserveRequirements(item, observacion);
    } else {
      await handleObservePayment(item, observacion);
    }
  };

  const requestReject = async (item) => {
    const observacion = window.prompt('Motivo de rechazo');
    if (!observacion?.trim()) return;
    await handleReject(item, observacion);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header
          title="Gestión de Preinscripciones CUP"
          breadcrumb="Sistema de Admisión CUP / Preinscripciones"
        />

        <div className="content-inner">
          <div className="stats-row">
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Total solicitudes</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">En revisión de requisitos</div>
              <div className="stat-value">{stats.enRevision}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Requisitos observados</div>
              <div className="stat-value">{stats.requisitosObservados}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Pago habilitado</div>
              <div className="stat-value">{stats.pagoHabilitado}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Pago en revisión</div>
              <div className="stat-value">{stats.pagoEnRevision}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Pago observado</div>
              <div className="stat-value">{stats.pagoObservado}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Inscritos</div>
              <div className="stat-value">{stats.inscritos}</div>
            </div>
            <div className="stat-card admin-stat-card">
              <div className="stat-label">Rechazados</div>
              <div className="stat-value">{stats.rechazados}</div>
            </div>
          </div>

          <div className="table-header-row">
            <div className="filters admin-filters">
              <label className="filter-group">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por CI, nombre o correo"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </label>
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="EN_REVISION_REQUISITOS">EN_REVISION_REQUISITOS</option>
                <option value="REQUISITOS_OBSERVADOS">REQUISITOS_OBSERVADOS</option>
                <option value="PAGO_HABILITADO">PAGO_HABILITADO</option>
                <option value="PAGO_EN_REVISION">PAGO_EN_REVISION</option>
                <option value="PAGO_OBSERVADO">PAGO_OBSERVADO</option>
                <option value="INSCRITO">INSCRITO</option>
                <option value="RECHAZADO">RECHAZADO</option>
              </select>
              <button className="btn-secondary" type="button" onClick={() => { setFilterText(''); setFilterEstado(''); }}>
                Limpiar filtros
              </button>
            </div>
            <button className="btn-primary btn-refresh" type="button" onClick={loadPreinscripciones}>
              <RefreshCcw size={16} /> Actualizar
            </button>
          </div>

          {message && <div className="form-message">{message}</div>}

          <div className="card table-card admin-table-card">
            <PreinscripcionesTable
              preinscripciones={filteredPreinscripciones}
              onView={openDetail}
              onApproveRequirements={handleApproveRequirements}
              onObserveRequirements={requestObserve}
              onApprovePayment={handleApprovePayment}
              onObservePayment={requestObserve}
              onReject={requestReject}
              loading={loading}
            />
          </div>

          <PreinscripcionDetailModal
            open={modalOpen}
            preinscripcion={selected}
            onClose={closeDetail}
            onApproveRequirements={handleApproveRequirements}
            onObserveRequirements={handleObserveRequirements}
            onApprovePayment={handleApprovePayment}
            onObservePayment={handleObservePayment}
            onReject={handleReject}
          />
        </div>
      </main>
    </div>
  );
}
