import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';
import { Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PagosPreinscripcionTable({ preinscripciones, onApprovePayment, onObservePayment, loading }) {
  if (loading) return <div className="loading-message">Cargando...</div>;
  if (!preinscripciones.length) return <div className="no-data">No hay solicitudes.</div>;

  const handleObserve = (item) => {
    const obs = window.prompt('Motivo de observación');
    if (obs?.trim()) onObservePayment(item, obs);
  };

  return (
    <div className="table-wrapper preinscripciones-table-wrapper">
      <table className="preinscripciones-table">
        <thead>
          <tr>
            <th>CI</th>
            <th>Nombre completo</th>
            <th>Correo</th>
            <th>Carrera principal</th>
            <th>Estado</th>
            <th>Observación</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {preinscripciones.map((item) => {
            const nombre = `${item.nombres || ''} ${item.apellidos || ''}`.trim() || '—';
            const estado = String(item.estado_preinscripcion || item.estado || '').toUpperCase();
            const fecha = item.created_at || item.fecha || '—';
            const primera = item.primera_carrera?.nombre || item.primera_carrera || '—';
            const observacion = item.observacion || item.observacion_pago || '—';

            return (
              <tr key={item.id}>
                <td>{item.ci || '—'}</td>
                <td>{nombre}</td>
                <td>{item.correo || '—'}</td>
                <td>{primera}</td>
                <td><EstadoPreinscripcionBadge estado={estado} /></td>
                <td>{observacion}</td>
                <td>{fecha}</td>
                <td>
                  <div className="actions-cell">
                    {estado === 'PAGO_HABILITADO' && (
                      <span className="payment-status" title="Esperando comprobante del postulante">
                        Esperando comprobante
                      </span>
                    )}
                    {estado === 'PAGO_EN_REVISION' && (
                      <>
                        <button className="icon-btn" type="button" title="Aprobar pago" onClick={() => onApprovePayment(item)}>
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="icon-btn" type="button" title="Observar pago" onClick={() => handleObserve(item)}>
                          <AlertTriangle size={18} />
                        </button>
                      </>
                    )}
                    {estado === 'PAGO_OBSERVADO' && (
                      <span className="payment-status-observed" title="Observación en pago">
                        Con observación
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
