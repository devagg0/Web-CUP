import { useMemo, useState } from 'react';
import { XCircle } from 'lucide-react';
import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';
import { normalizeFileUrl } from '../services/api';

const ACTION_RULES = {
  EN_REVISION_REQUISITOS: { approveRequirements: true, observeRequirements: true, reject: true },
  REQUISITOS_OBSERVADOS: { observeRequirements: true, reject: true },
  PAGO_HABILITADO: {},
  INSCRITO: {},
  RECHAZADO: {},
};

export default function PreinscripcionDetailModal({
  open,
  preinscripcion,
  onClose,
  onApproveRequirements,
  onObserveRequirements,
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

  const getRequisito = (tipo) => {
    if (!record) return null;
    const arr = record.requisitos || [];
    return arr.find((r) => String(r.tipo_requisito || '').toUpperCase() === String(tipo).toUpperCase()) || null;
  };

  const getFileLink = (fileObj) => {
    if (!fileObj) return null;
    const rawLink = fileObj.archivo_url || fileObj.comprobante_url || fileObj.url || fileObj.path || null;
    return normalizeFileUrl(rawLink);
  };

  const handleAction = async () => {
    if (!record) return;
    if (actionType === 'observe-requisitos') {
      await onObserveRequirements(record, observacion);
    }
    if (actionType === 'reject') {
      await onReject(record, observacion);
    }
    setActionType('');
    setObservacion('');
  };

  if (!open || !record) return null;

  const estado = String(record.estado_preinscripcion || record.estado || record.status || '').toUpperCase();
  const rules = ACTION_RULES[estado] || {};

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
            <p>
              <strong>Título de bachiller:</strong>{' '}
              {(() => {
                const r = getRequisito('TITULO_BACHILLER');
                const fileLink = r ? getFileLink(r) : null;
                return fileLink ? (
                  <a href={fileLink} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                ) : (
                  'No disponible'
                );
              })()}
            </p>
            <p>
              <strong>Carnet de identidad:</strong>{' '}
              {(() => {
                const r = getRequisito('CARNET_IDENTIDAD');
                const fileLink = r ? getFileLink(r) : null;
                return fileLink ? (
                  <a href={fileLink} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                ) : (
                  'No disponible'
                );
              })()}
            </p>
            <p>
              <strong>Otros:</strong>{' '}
              {(() => {
                const r = getRequisito('OTROS');
                const fileLink = r ? getFileLink(r) : null;
                return fileLink ? (
                  <a href={fileLink} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                ) : (
                  'No hay otros archivos'
                );
              })()}
            </p>

            <p>
              <strong>Comprobante de pago:</strong>{' '}
              {(() => {
                // Posibles ubicaciones del comprobante
                const pago = record.pago || record.pago_preinscripcion || null;
                const comprobante = pago ? (pago.comprobante_url ? { archivo_url: pago.comprobante_url } : pago) : record.comprobante_pago || null;
                const link = getFileLink(comprobante);
                if (link) {
                  return <a href={link} target="_blank" rel="noopener noreferrer">Ver comprobante</a>;
                }
                // Si no existe comprobante y pago aún no enviado
                const estadoLocal = String(record.estado_preinscripcion || record.estado || record.status || '').toUpperCase();
                if (estadoLocal === 'PAGO_HABILITADO') {
                  return 'Comprobante pendiente.';
                }
                return 'No disponible';
              })()}
            </p>
          </div>
        </div>

        <div className="action-grid">
          {rules.approveRequirements && (
            <button type="button" className="btn-primary" onClick={() => onApproveRequirements(record)}>
              Aprobar requisitos
            </button>
          )}
          {rules.observeRequirements && (
            <button type="button" className="btn-secondary" onClick={() => setActionType('observe-requisitos')}>
              Observar requisitos
            </button>
          )}
          {rules.reject && (
            <button type="button" className="btn-danger" onClick={() => setActionType('reject')}>
              Rechazar
            </button>
          )}
        </div>

        {estado === 'PAGO_HABILITADO' && (
          <div className="observation-panel">
            <strong>Pago habilitado</strong>
            <p>Esperando el comprobante de pago del postulante.</p>
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
              Enviar {actionType === 'observe-requisitos' ? 'observación' : 'rechazo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
