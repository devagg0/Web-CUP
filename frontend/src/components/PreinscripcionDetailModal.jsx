import { useMemo, useState } from 'react';
import { XCircle } from 'lucide-react';
import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';

const requirementStates = ['EN_REVISION_REQUISITOS', 'REQUISITOS_OBSERVADOS'];
const paymentStates = ['PAGO_EN_REVISION', 'PAGO_OBSERVADO'];

export default function PreinscripcionDetailModal({
  open,
  preinscripcion,
  onClose,
  onApproveRequirements,
  onObserveRequirements,
  onApprovePayment,
  onObservePayment,
  onReject,
}) {
  const [actionType, setActionType] = useState('');
  const [observacion, setObservacion] = useState('');

  const record = preinscripcion;
  const nombreCompleto = useMemo(() => {
    if (!record) return '';
    return `${record.nombres || ''} ${record.apellidos || ''}`.trim();
  }, [record]);

  const getCourseName = (course) => {
    if (!course) return '—';
    if (typeof course === 'string') return course;
    return course.nombre || course.name || '—';
  };

  const getFileLink = (file) => {
    if (!file) return null;
    if (typeof file === 'string') return file;
    return file.url || file.path || null;
  };

  const getFileName = (file) => {
    if (!file) return 'No disponible';
    if (typeof file === 'string') {
      return file.split('/').pop();
    }
    return file.name || file.url?.split('/').pop() || 'Archivo adjunto';
  };

  const handleAction = async () => {
    if (!record) return;
    if (actionType === 'observe-requisitos') {
      await onObserveRequirements(record, observacion);
    }
    if (actionType === 'observe-pago') {
      await onObservePayment(record, observacion);
    }
    if (actionType === 'reject') {
      await onReject(record, observacion);
    }
    setActionType('');
    setObservacion('');
  };

  if (!open || !record) return null;

  const estado = String(record.estado || record.status || '').toUpperCase();
  const showRequirementActions = requirementStates.includes(estado);
  const showPaymentActions = paymentStates.includes(estado);

  return (
    <div className="detail-modal-overlay">
      <div className="detail-modal">
        <button className="detail-close" type="button" onClick={onClose} title="Cerrar detalle">
          <XCircle size={24} />
        </button>
        <h3>Detalle de preinscripción</h3>
        <div className="detail-section">
          <div className="detail-item">
            <strong>Datos personales</strong>
            <p><strong>CI:</strong> {record.ci || '—'}</p>
            <p><strong>Nombre:</strong> {nombreCompleto || '—'}</p>
            <p><strong>Correo:</strong> {record.correo || '—'}</p>
            <p><strong>Teléfono:</strong> {record.telefono || '—'}</p>
            <p><strong>Ciudad:</strong> {record.ciudad || '—'}</p>
          </div>
          <div className="detail-item">
            <strong>Carreras</strong>
            <p><strong>Primera:</strong> {getCourseName(record.primera_carrera)}</p>
            <p><strong>Segunda:</strong> {getCourseName(record.segunda_carrera)}</p>
            <p><strong>Estado:</strong> <EstadoPreinscripcionBadge estado={estado} /></p>
            <p><strong>Fecha:</strong> {record.created_at || record.fecha || record.fecha_creacion || record.createdAt || '—'}</p>
          </div>
        </div>

        <div className="detail-section single">
          <div className="detail-item">
            <strong>Archivos cargados</strong>
            <p><strong>Título de bachiller:</strong> {getFileName(record.titulo_bachiller)}</p>
            <p><strong>Carnet de identidad:</strong> {getFileName(record.carnet_identidad)}</p>
            <p><strong>Otros:</strong> {record.otros ? getFileName(record.otros) : 'No hay otros archivos'}</p>
            <p><strong>Comprobante de pago:</strong> {getFileName(record.comprobante_pago)}</p>
            {getFileLink(record.comprobante_pago) && (
              <p><a href={getFileLink(record.comprobante_pago)} target="_blank" rel="noreferrer">Ver comprobante</a></p>
            )}
          </div>
        </div>

        <div className="action-grid">
          {showRequirementActions && (
            <>
              <button type="button" className="btn-primary" onClick={() => onApproveRequirements(record)}>
                Aprobar requisitos
              </button>
              <button type="button" className="btn-secondary" onClick={() => setActionType('observe-requisitos')}>
                Observar requisitos
              </button>
            </>
          )}
          {showPaymentActions && (
            <>
              <button type="button" className="btn-primary" onClick={() => onApprovePayment(record)}>
                Aprobar pago
              </button>
              <button type="button" className="btn-secondary" onClick={() => setActionType('observe-pago')}>
                Observar pago
              </button>
            </>
          )}
          <button type="button" className="btn-danger" onClick={() => setActionType('reject')}>
            Rechazar
          </button>
        </div>

        {estado === 'PAGO_HABILITADO' && (
          <div className="observation-panel">
            <strong>Pago habilitado</strong>
            <p>Pago habilitado, esperando comprobante del postulante.</p>
          </div>
        )}

        {estado === 'INSCRITO' && (
          <div className="observation-panel">
            <strong>Inscrito</strong>
            <p>La inscripción fue aprobada. {record.registro ? `Registro: ${record.registro}.` : ''} {record.password_temporal ? `Contraseña temporal: ${record.password_temporal}.` : ''}</p>
          </div>
        )}

        {actionType && (
          <div className="observation-panel">
            <strong>
              {actionType === 'observe-requisitos'
                ? 'Motivo de observación de requisitos'
                : actionType === 'observe-pago'
                ? 'Motivo de observación de pago'
                : 'Motivo de rechazo'}
            </strong>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe el motivo para el postulante"
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleAction}
              disabled={!observacion.trim()}
            >
              Enviar {actionType.includes('observe') ? 'observación' : 'rechazo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
