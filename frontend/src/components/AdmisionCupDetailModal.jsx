import React from 'react';
import { X, Award, AlertTriangle, GraduationCap, XOctagon, CheckCircle } from 'lucide-react';
import EstadoAdmisionBadge from './EstadoAdmisionBadge';

const getCarreraNombre = (carrera) => {
  if (!carrera) return 'Sin carrera';
  if (typeof carrera === 'string') return carrera;
  if (typeof carrera === 'object') return carrera.nombre ?? carrera.descripcion ?? `Carrera ${carrera.id ?? ''}`;
  return String(carrera);
};

export default function AdmisionCupDetailModal({ admision, onClose }) {
  if (!admision) return null;

  const nombrePostulante =
    admision?.postulante?.nombre_completo ||
    admision?.postulante_nombre ||
    [admision?.postulante?.nombres, admision?.postulante?.apellidos].filter(Boolean).join(' ') ||
    'Sin nombre';

  const ciPostulante =
    admision?.postulante?.ci ||
    admision?.postulante_ci ||
    admision?.ci ||
    'Sin CI';

  const correoPostulante =
    admision?.postulante?.email ||
    admision?.postulante?.correo ||
    admision?.postulante?.user?.email ||
    admision?.correo ||
    'Sin correo';

  const promedioFinal =
    admision?.promedio !== undefined && admision?.promedio !== null
      ? Number(admision.promedio).toFixed(2)
      : '-';

  const estadoAcademico = admision?.estado_academico || 'PENDIENTE';
  const primeraCarrera = getCarreraNombre(admision?.primera_carrera || admision?.primera_carrera_nombre);
  const segundaCarrera = getCarreraNombre(admision?.segunda_carrera || admision?.segunda_carrera_nombre);
  const carreraAsignadaRaw = admision?.carrera_asignada || admision?.carrera_asignada_nombre;
  const carreraAsignada = carreraAsignadaRaw ? getCarreraNombre(carreraAsignadaRaw) : null;
  const estadoAdmision = admision?.estado_admision || admision?.estado || 'PENDIENTE';
  const tipoAdmision = admision?.tipo_admision || 'No asignado';
  const posicionRanking = admision?.posicion_ranking || admision?.ranking || '-';
  const observacion = admision?.observacion || 'Ninguna';
  
  const fechaProcesamiento = admision?.fecha_procesamiento || admision?.updated_at || admision?.created_at;
  const fechaFormateada = fechaProcesamiento
    ? new Date(fechaProcesamiento).toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No disponible';

  return (
    <div className="detail-modal-overlay admisiones-modal-overlay" onClick={onClose}>
      <div className="detail-modal admisiones-detail-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Modal */}
        <div className="modal-title-row">
          <div>
            <h3>Detalle de Admisión CUP</h3>
            <p>Resultado del proceso de asignación de cupos por ranking académico.</p>
          </div>
          <button className="icon-btn close-modal-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Alertas dinámicas según estado */}
        <div className="admisiones-modal-alerts">
          {estadoAdmision === 'APROBADO_SIN_CUPO' && (
            <div className="notice warning inline">
              <AlertTriangle size={20} />
              <span>El postulante aprobó académicamente, pero no alcanzó cupo en sus carreras elegidas.</span>
            </div>
          )}
          {estadoAdmision === 'PENDIENTE' && (
            <div className="notice warning inline" style={{ backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
              <GraduationCap size={20} />
              <span>El postulante aún no tiene evaluación académica completa.</span>
            </div>
          )}
          {estadoAdmision === 'REPROBADO' && (
            <div className="notice danger inline">
              <XOctagon size={20} />
              <span>El postulante no aprobó académicamente el CUP.</span>
            </div>
          )}
          {(estadoAdmision === 'ADMITIDO_PRIMERA_OPCION' || estadoAdmision === 'ADMITIDO_SEGUNDA_OPCION') && (
            <div className="notice success inline">
              <CheckCircle size={20} />
              <span>
                ¡Postulante admitido! Asignado a la carrera de:{' '}
                <strong>{carreraAsignada || 'Sin carrera asignada'}</strong>.
              </span>
            </div>
          )}
        </div>

        <div className="admisiones-modal-grid">
          
          {/* Tarjeta de Información General */}
          <div className="detail-info-card wide">
            <span>Postulante</span>
            <strong>{nombrePostulante}</strong>
          </div>

          <div className="detail-info-card">
            <span>Cédula de Identidad (CI)</span>
            <strong>{ciPostulante}</strong>
          </div>

          <div className="detail-info-card">
            <span>Correo Electrónico</span>
            <strong>{correoPostulante}</strong>
          </div>

          {/* Sección de Resultados de Admisión */}
          <div className="admisiones-section-title">
            <Award size={16} /> <span>Resultado de Admisión</span>
          </div>

          <div className="detail-info-card">
            <span>Estado Admisión</span>
            <div style={{ marginTop: '4px' }}>
              <EstadoAdmisionBadge estado={estadoAdmision} />
            </div>
          </div>

          <div className="detail-info-card">
            <span>Carrera Asignada</span>
            <strong className={carreraAsignada ? 'text-primary-color' : 'text-muted'}>
              {carreraAsignada || 'Sin carrera asignada'}
            </strong>
          </div>

          <div className="detail-info-card">
            <span>Posición en Ranking</span>
            <strong>{posicionRanking}</strong>
          </div>

          <div className="detail-info-card">
            <span>Tipo de Admisión</span>
            <strong>{tipoAdmision}</strong>
          </div>

          <div className="detail-info-card">
            <span>Fecha de Procesamiento</span>
            <strong>{fechaFormateada}</strong>
          </div>

          <div className="detail-info-card">
            <span>Promedio Final CUP</span>
            <strong className="promedio-destacado">{promedioFinal}</strong>
          </div>

          {/* Sección de Carreras Elegidas */}
          <div className="admisiones-section-title">
            <GraduationCap size={16} /> <span>Carreras elegidas</span>
          </div>

          <div className="detail-info-card">
            <span>Primera Opción (1ra Carrera)</span>
            <strong>{primeraCarrera}</strong>
          </div>

          <div className="detail-info-card">
            <span>Segunda Opción (2da Carrera)</span>
            <strong>{segundaCarrera}</strong>
          </div>

          {/* Sección de Datos Académicos */}
          <div className="admisiones-section-title">
            <GraduationCap size={16} /> <span>Datos Académicos</span>
          </div>

          <div className="detail-info-card">
            <span>Estado Académico CUP</span>
            <strong className={`estado-academico-text ${estadoAcademico.toLowerCase()}`}>
              {estadoAcademico}
            </strong>
          </div>

          <div className="detail-info-card wide">
            <span>Observación del Proceso</span>
            <p className="observacion-texto">{observacion}</p>
          </div>

        </div>

        <div className="modal-actions">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
