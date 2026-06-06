import { X } from 'lucide-react';
import EstadoGrupoBadge from './EstadoGrupoBadge';

const text = (value) => value || 'No registrado';

const getPayload = (detail) => detail?.data || detail?.grupo || detail;

const getGrupo = (detail) => {
  const payload = getPayload(detail);
  return payload?.grupo || payload || {};
};

const getEstudiantes = (detail) => {
  const payload = getPayload(detail);
  const estudiantes = payload?.estudiantes || payload?.grupo?.estudiantes || [];
  return Array.isArray(estudiantes) ? estudiantes : [];
};

const getNombreCompleto = (estudiante) => (
  estudiante?.nombre_completo
  || estudiante?.nombre
  || [estudiante?.nombres, estudiante?.apellidos].filter(Boolean).join(' ')
  || 'Sin nombre'
);

export default function GrupoCupDetailModal({ detail, onClose }) {
  if (!detail) return null;

  const grupo = getGrupo(detail);
  const estudiantes = getEstudiantes(detail);

  return (
    <div className="detail-modal-overlay grupo-modal-overlay" onClick={onClose}>
      <div className="detail-modal grupo-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>{`Estudiantes del Grupo ${grupo.codigo || grupo.nombre || ''}`}</h3>
            <p>Postulantes asignados automáticamente a este grupo CUP.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="grupo-detail-summary">
          <div><span>Código</span><strong>{text(grupo.codigo)}</strong></div>
          <div><span>Nombre</span><strong>{text(grupo.nombre)}</strong></div>
          <div><span>Capacidad máxima</span><strong>{grupo.capacidad_maxima ?? 0}</strong></div>
          <div><span>Cantidad de estudiantes</span><strong>{grupo.cantidad_estudiantes ?? estudiantes.length}</strong></div>
          <div><span>Estado</span><EstadoGrupoBadge estado={grupo.estado} /></div>
        </div>

        <div className="grupo-students-section">
          <h4>Estudiantes asignados</h4>
          {estudiantes.length === 0 ? (
            <div className="empty-state">No hay estudiantes asignados a este grupo.</div>
          ) : (
            <div className="grupo-students-table-wrapper">
              <table className="grupo-students-table">
                <thead>
                  <tr>
                    <th>CI</th>
                    <th>Nombre completo</th>
                    <th>Correo</th>
                    <th>Primera carrera</th>
                    <th>Segunda carrera</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((estudiante, index) => (
                    <tr key={estudiante.id || estudiante.ci || index}>
                      <td>{text(estudiante.ci)}</td>
                      <td><strong>{getNombreCompleto(estudiante)}</strong></td>
                      <td>{text(estudiante.correo || estudiante.email)}</td>
                      <td>{text(estudiante.primera_carrera)}</td>
                      <td>{text(estudiante.segunda_carrera)}</td>
                      <td>{text(estudiante.estado_preinscripcion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
