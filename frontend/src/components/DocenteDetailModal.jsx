import { X, ExternalLink } from 'lucide-react';
import { normalizeFileUrl } from '../services/api';
import EstadoDocenteBadge from './EstadoDocenteBadge';

const getUser = (docente) => docente?.user || docente?.usuario || {};

const text = (value) => value || 'No registrado';

const boolText = (value) => (value ? 'Sí' : 'No');

const fullName = (user) => {
  const parts = [user.name, user.nombres, user.apellidos].filter(Boolean);
  return parts.length ? parts.join(' ') : user.nombre_completo || user.email || 'Docente';
};

const materiaName = (docente) => docente?.materia?.nombre || docente?.materia_habilitada?.nombre || docente?.materia_nombre || 'Sin materia';

const approverName = (docente) => {
  const user = docente?.aprobado_por || docente?.aprobador || {};
  return fullName(user) === 'Docente' ? 'No registrado' : fullName(user);
};

const documentFields = [
  ['titulo_profesional', 'Título profesional'],
  ['certificado_maestria', 'Certificado maestría'],
  ['certificado_diplomado', 'Certificado diplomado'],
  ['cv', 'CV'],
];

const getDocumentUrl = (docente, field) => {
  const value = docente?.[field]
    || docente?.[`${field}_url`]
    || docente?.documentos?.[field]
    || docente?.documentos?.[`${field}_url`];

  if (!value) return null;
  if (typeof value === 'string') return normalizeFileUrl(value);
  return normalizeFileUrl(value.url || value.path || value.archivo_url);
};

export default function DocenteDetailModal({ docente, onClose }) {
  if (!docente) return null;

  const user = getUser(docente);

  return (
    <div className="detail-modal-overlay docente-modal-overlay" onClick={onClose}>
      <div className="detail-modal docente-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Detalle del docente</h3>
            <p>Perfil académico, requisitos y documentos cargados.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="detail-hero">
          <div>
            <h4>{fullName(user)}</h4>
            <span>{user.email || user.correo || 'Sin correo'}</span>
          </div>
          <EstadoDocenteBadge estado={docente.estado_docente} />
        </div>

        <div className="detail-grid">
          <div><span>CI</span><strong>{text(docente.ci)}</strong></div>
          <div><span>Teléfono</span><strong>{text(docente.telefono)}</strong></div>
          <div><span>Profesión</span><strong>{text(docente.profesion)}</strong></div>
          <div><span>Especialidad</span><strong>{text(docente.especialidad)}</strong></div>
          <div><span>Materia habilitada</span><strong>{materiaName(docente)}</strong></div>
          <div><span>Maestría</span><strong>{boolText(docente.tiene_maestria)}</strong></div>
          <div><span>Diplomado</span><strong>{boolText(docente.tiene_diplomado)}</strong></div>
          <div><span>Años experiencia</span><strong>{docente.anios_experiencia ?? 0}</strong></div>
          <div><span>Fecha envío revisión</span><strong>{text(docente.fecha_envio_revision)}</strong></div>
          <div><span>Fecha aprobación</span><strong>{text(docente.fecha_aprobacion)}</strong></div>
          <div><span>Aprobado por</span><strong>{approverName(docente)}</strong></div>
          <div><span>Grupos asignados actuales</span><strong>{docente.grupos_asignados_count || 0} / 4</strong></div>
        </div>

        <div className="observation-box">
          <span>Observación admin</span>
          <p>{docente.observacion_admin || 'Sin observaciones registradas.'}</p>
        </div>

        <section className="documents-section">
          <h4>Documentos</h4>
          <div className="documents-list">
            {documentFields.map(([field, label]) => {
              const url = getDocumentUrl(docente, field);
              return (
                <div className="document-row" key={field}>
                  <span>{label}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      Ver archivo <ExternalLink size={15} />
                    </a>
                  ) : (
                    <strong>No disponible</strong>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
