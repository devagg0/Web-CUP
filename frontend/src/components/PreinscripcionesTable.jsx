import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';
import { Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const needsRequirementActions = ['EN_REVISION_REQUISITOS', 'REQUISITOS_OBSERVADOS'];
const needsPaymentActions = ['PAGO_EN_REVISION', 'PAGO_OBSERVADO'];

export default function PreinscripcionesTable({
  preinscripciones,
  onView,
  onApproveRequirements,
  onObserveRequirements,
  onApprovePayment,
  onObservePayment,
  onReject,
  loading,
}) {
  if (loading) {
    return <div className="loading-message">Cargando preinscripciones...</div>;
  }

  if (!preinscripciones.length) {
    return <div className="no-data">No hay solicitudes que coincidan con los filtros.</div>;
  }

  return (
    <div className="table-wrapper preinscripciones-table-wrapper">
      <table className="preinscripciones-table">
        <thead>
          <tr>
            <th>CI</th>
            <th>Nombre completo</th>
            <th>Correo</th>
            <th>Primera carrera</th>
            <th>Segunda carrera</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {preinscripciones.map((item) => {
            const primeraCarrera = item.primera_carrera?.nombre || item.primera_carrera || item.primeraCarrera || '—';
            const segundaCarrera = item.segunda_carrera?.nombre || item.segunda_carrera || item.segundaCarrera || '—';
            const nombreCompleto = `${item.nombres || ''} ${item.apellidos || ''}`.trim() || '—';
            const fecha = item.created_at || item.fecha || item.fecha_creacion || item.createdAt || '—';
            const estado = String(item.estado || item.status || '').toUpperCase();
            const showRequirementButtons = needsRequirementActions.includes(estado);
            const showPaymentButtons = needsPaymentActions.includes(estado);

            return (
              <tr key={item.id}>
                <td>{item.ci || '—'}</td>
                <td>{nombreCompleto}</td>
                <td>{item.correo || '—'}</td>
                <td>{primeraCarrera}</td>
                <td>{segundaCarrera}</td>
                <td><EstadoPreinscripcionBadge estado={estado} /></td>
                <td>{fecha}</td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn" type="button" title="Ver detalle" onClick={() => onView(item)}>
                      <Eye size={18} />
                    </button>
                    {showRequirementButtons && (
                      <>
                        <button className="icon-btn" type="button" title="Aprobar requisitos" onClick={() => onApproveRequirements(item)}>
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="icon-btn" type="button" title="Observar requisitos" onClick={() => onObserveRequirements(item)}>
                          <AlertTriangle size={18} />
                        </button>
                      </>
                    )}
                    {showPaymentButtons && (
                      <>
                        <button className="icon-btn" type="button" title="Aprobar pago" onClick={() => onApprovePayment(item)}>
                          <CheckCircle2 size={18} />
                        </button>
                        <button className="icon-btn" type="button" title="Observar pago" onClick={() => onObservePayment(item)}>
                          <AlertTriangle size={18} />
                        </button>
                      </>
                    )}
                    <button className="icon-btn danger" type="button" title="Rechazar solicitud" onClick={() => onReject(item)}>
                      <XCircle size={18} />
                    </button>
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
