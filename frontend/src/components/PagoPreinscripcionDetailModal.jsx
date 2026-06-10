import { useMemo, useState } from 'react';
import { XCircle } from 'lucide-react';
import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';
import { normalizeFileUrl } from '../services/api';

const getEstado = (record) => String(record?.estado_preinscripcion || record?.estado || '').toUpperCase();

const getCourseName = (course) => {
  if (!course) return '—';
  if (typeof course === 'string') return course;
  return course.nombre || course.name || '—';
};

const getComprobanteRaw = (record) => {
  const pago = record?.pago || {};
  const pagoPreinscripcion = record?.pago_preinscripcion || {};
  return (
    pago.comprobante_url ||
    pago.comprobante_path ||
    pagoPreinscripcion.comprobante_url ||
    pagoPreinscripcion.comprobante_path ||
    null
  );
};

const getComprobanteUrl = (record) => {
  const raw = getComprobanteRaw(record);
  if (!raw) return null;
  const value = String(raw).replace(/^public\//, '');
  if (/^https?:\/\//i.test(value) || value.startsWith('/storage') || value.startsWith('storage')) {
    return normalizeFileUrl(value);
  }
  return normalizeFileUrl(`storage/${value.replace(/^\/+/, '')}`);
};

export default function PagoPreinscripcionDetailModal({
  open,
  preinscripcion,
  onClose,
  onApprovePayment,
  onObservePayment,
}) {
  const [showObservation, setShowObservation] = useState(false);
  const [observacion, setObservacion] = useState('');

  const record = preinscripcion;
  const nombreCompleto = useMemo(() => {
    if (!record) return '';
    return `${record.nombres || ''} ${record.apellidos || ''}`.trim();
  }, [record]);

  if (!open || !record) return null;

  const estado = getEstado(record);
  const comprobanteUrl = getComprobanteUrl(record);
  const pago = record.pago || record.pago_preinscripcion || {};
  const observacionPago = pago.observacion || record.observacion_pago || record.observacion || '—';
  const canReviewPayment = estado === 'PAGO_EN_REVISION' && (Boolean(comprobanteUrl) || pago.metodo_pago === 'STRIPE');

  const handleObserve = async () => {
    if (!observacion.trim()) return;
    await onObservePayment(record, observacion);
    setShowObservation(false);
    setObservacion('');
  };

  const handleClose = () => {
    setShowObservation(false);
    setObservacion('');
    onClose();
  };

  return (
    <div className="detail-modal-overlay">
      <div className="detail-modal">
        <button className="detail-close" type="button" onClick={handleClose} title="Cerrar detalle">
          <XCircle size={24} />
        </button>
        <h3>Detalle de pago CUP</h3>

        <div className="detail-section">
          <div className="detail-item">
            <strong>Datos del postulante</strong>
            <p><strong>CI:</strong> {record.ci || '—'}</p>
            <p><strong>Nombre:</strong> {nombreCompleto || '—'}</p>
            <p><strong>Correo:</strong> {record.correo || '—'}</p>
            <p><strong>Carrera principal:</strong> {getCourseName(record.primera_carrera)}</p>
          </div>
          <div className="detail-item">
            <strong>Datos del pago</strong>
            {pago.metodo_pago === 'STRIPE' ? (
              <>
                <p><strong>Método:</strong> Stripe modo prueba</p>
                <p><strong>Stripe Session ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{pago.stripe_session_id || '—'}</span></p>
                <p><strong>Stripe Payment Intent:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{pago.stripe_payment_intent_id || '—'}</span></p>
                <p><strong>Fecha de pago:</strong> {pago.fecha_pago || pago.created_at || '—'}</p>
                <p><strong>Monto:</strong> {pago.monto || '—'} USD</p>
                <p><strong>Estado de validación:</strong> <EstadoPreinscripcionBadge estado={estado} /></p>
              </>
            ) : (
              <>
                <p><strong>Estado:</strong> <EstadoPreinscripcionBadge estado={estado} /></p>
                <p><strong>Fecha:</strong> {pago.created_at || pago.fecha || record.updated_at || record.created_at || record.fecha || '—'}</p>
                <p><strong>Monto:</strong> {pago.monto || pago.importe || record.monto_pago || '—'}</p>
                <p>
                  <strong>Comprobante:</strong>{' '}
                  {comprobanteUrl ? (
                    <a href={comprobanteUrl} target="_blank" rel="noopener noreferrer">Ver comprobante</a>
                  ) : (
                    'Comprobante pendiente.'
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        {estado === 'PAGO_HABILITADO' && (
          <div className="observation-panel">
            <strong>Pago habilitado</strong>
            <p>Esperando pago del postulante.</p>
          </div>
        )}

        {estado === 'PAGO_OBSERVADO' && (
          <div className="observation-panel">
            <strong>Pago observado</strong>
            <p>{observacionPago}</p>
          </div>
        )}

        {estado === 'INSCRITO' && (
          <div className="observation-panel">
            <strong>Inscrito</strong>
            <p>Pago aprobado. Postulante inscrito correctamente.</p>
          </div>
        )}

        {estado === 'PAGO_EN_REVISION' && !comprobanteUrl && pago.metodo_pago !== 'STRIPE' && (
          <div className="observation-panel">
            <strong>Comprobante pendiente.</strong>
            <p>No se puede aprobar el pago hasta que exista un comprobante.</p>
          </div>
        )}

        {estado === 'PAGO_EN_REVISION' && (
          <div className="action-grid">
            {canReviewPayment && (
              <>
                <button type="button" className="btn-primary" onClick={() => onApprovePayment(record)}>
                  Aprobar pago
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowObservation(true)}>
                  Observar pago
                </button>
              </>
            )}
          </div>
        )}

        {showObservation && (
          <div className="observation-panel">
            <strong>Motivo de observación de pago</strong>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe el motivo para el postulante"
            />
            <button type="button" className="btn-primary" onClick={handleObserve} disabled={!observacion.trim()}>
              Enviar observación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
