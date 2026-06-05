import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import * as preinscripcionService from '../services/preinscripcion';
import PagosPreinscripcionTable from '../components/PagosPreinscripcionTable';
import { ESTADOS } from '../utils/estadoPreinscripcion';
import '../styles/adminPagosPreinscripcion.css';

// Estados válidos en Pagos CUP
const VALID_PAYMENT_STATES = ['PAGO_HABILITADO', 'PAGO_EN_REVISION', 'PAGO_OBSERVADO'];

export default function AdminPagosPreinscripcion() {
  const [preinscripciones, setPreinscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
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
      setMessage('No se pudieron cargar las preinscripciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreinscripciones();
  }, []);

  const stats = useMemo(() => {
    const filtered = preinscripciones.filter((p) => 
      VALID_PAYMENT_STATES.includes(String(p.estado_preinscripcion || p.estado || '').toUpperCase())
    );
    
    return {
      pagoHabilitado: filtered.filter((item) => String(item.estado_preinscripcion || item.estado || '').toUpperCase() === 'PAGO_HABILITADO').length,
      pagoEnRevision: filtered.filter((item) => String(item.estado_preinscripcion || item.estado || '').toUpperCase() === 'PAGO_EN_REVISION').length,
      pagoObservado: filtered.filter((item) => String(item.estado_preinscripcion || item.estado || '').toUpperCase() === 'PAGO_OBSERVADO').length,
    };
  }, [preinscripciones]);

  const filtered = useMemo(() => {
    return preinscripciones
      .filter((p) => VALID_PAYMENT_STATES.includes(String(p.estado_preinscripcion || p.estado || '').toUpperCase()))
      .filter((item) => {
        const q = filterText.toLowerCase().trim();
        const matchesSearch = !q || [item.ci, item.nombres, item.apellidos, item.correo].filter(Boolean).some((f) => f.toLowerCase().includes(q));
        const estadoVal = String(item.estado_preinscripcion || item.estado || '').toUpperCase();
        const matchesEstado = !filterEstado || estadoVal === filterEstado;
        return matchesSearch && matchesEstado;
      });
  }, [preinscripciones, filterText, filterEstado]);

  const handleApprovePayment = async (item) => {
    try {
      const response = await preinscripcionService.aprobarPago(item.id);
      const data = response.data || response;
      setMessage('Pago aprobado. Usuario postulante generado correctamente.');
      if (data.registro || data.password_temporal || data.contrasena_temporal) {
        window.alert(`Registro: ${data.registro || ''}\nContraseña temporal: ${data.password_temporal || data.contrasena_temporal || ''}`);
      }
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al aprobar el pago.');
    }
  };

  const handleObservePayment = async (item, observacion) => {
    try {
      await preinscripcionService.observarPago(item.id, observacion);
      setMessage('Pago observado. El postulante será notificado.');
      await loadPreinscripciones();
    } catch (err) {
      console.error(err);
      setMessage('Error al observar el pago.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Pagos CUP" breadcrumb="Sistema de Admisión CUP / Pagos" />
        <div className="content-inner">
          <div className="page-intro">
            <h2>Gestión de Pagos CUP</h2>
            <p>Revisión de comprobantes y generación de credenciales.</p>
          </div>

          <div className="stats-row">
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
          </div>

          <div className="filters-row">
            <input placeholder="Buscar por CI, nombre o correo" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {VALID_PAYMENT_STATES.map((k) => (
                <option key={k} value={k}>{ESTADOS[k]?.label || k}</option>
              ))}
            </select>
            <button className="btn-secondary" type="button" onClick={() => { setFilterText(''); setFilterEstado(''); }}>Limpiar</button>
            <button className="btn-primary" type="button" onClick={loadPreinscripciones}>Recargar</button>
          </div>

          {message && <div className="form-message">{message}</div>}

          <div className="card table-card admin-table-card">
            <PagosPreinscripcionTable
              preinscripciones={filtered}
              onApprovePayment={handleApprovePayment}
              onObservePayment={handleObservePayment}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
