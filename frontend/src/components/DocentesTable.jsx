import { CheckCircle, Edit3, Eye, PauseCircle, Send, XCircle, AlertTriangle } from 'lucide-react';
import EstadoDocenteBadge from './EstadoDocenteBadge';

const getUser = (docente) => docente?.user || docente?.usuario || {};

const fullName = (user) => {
  const parts = [user.name, user.nombres, user.apellidos].filter(Boolean);
  return parts.length ? parts.join(' ') : user.nombre_completo || user.email || 'Docente';
};

const getDocenteNombre = (docente) =>
  docente?.nombre_usuario ??
  docente?.nombre ??
  docente?.nombre_completo ??
  docente?.user?.name ??
  docente?.usuario?.name ??
  docente?.user?.nombre ??
  docente?.usuario?.nombre ??
  fullName(getUser(docente));

const materiaName = (docente) => docente?.materia?.nombre || docente?.materia_habilitada?.nombre || docente?.materia_nombre || 'Sin materia';

const boolLabel = (value) => (value ? 'Sí' : 'No');

const getDocenteCorreo = (docente) =>
  docente?.correo_usuario ??
  docente?.correo ??
  docente?.email ??
  docente?.user?.email ??
  docente?.usuario?.email ??
  docente?.user?.correo ??
  docente?.usuario?.correo ??
  docente?.correo_fallback ??
  'Sin correo';

const getGruposAsignadosDocente = (docente) =>
  docente?.grupos_asignados_actuales
  ?? docente?.grupos_asignados
  ?? docente?.grupos_asignados_docente
  ?? docente?.asignaciones_activas
  ?? docente?.total_grupos_asignados
  ?? docente?.asignacionesGrupo?.filter(a => String(a.estado).toUpperCase() === 'ACTIVA').length
  ?? docente?.asignaciones_docentes?.filter(a => String(a.estado).toUpperCase() === 'ACTIVA').length
  ?? docente?.asignaciones?.filter(a => String(a.estado).toUpperCase() === 'ACTIVA').length
  ?? 0;

const getMaxGruposDocente = (docente) =>
  docente?.capacidad_grupos_maxima
  ?? docente?.max_grupos
  ?? docente?.maximo_grupos
  ?? 4;

const actionsByEstado = {
  PERFIL_PENDIENTE: ['view', 'edit', 'send'],
  EN_REVISION: ['view', 'edit', 'approve', 'observe', 'reject'],
  OBSERVADO: ['view', 'edit', 'send', 'reject'],
  HABILITADO: ['view', 'edit', 'inactive'],
  RECHAZADO: ['view', 'edit'],
  INACTIVO: ['view', 'edit'],
};

const actionMeta = {
  view: { label: 'Ver detalle', icon: Eye },
  edit: { label: 'Editar', icon: Edit3 },
  send: { label: 'Enviar a revisión', icon: Send },
  approve: { label: 'Aprobar', icon: CheckCircle },
  observe: { label: 'Observar', icon: AlertTriangle },
  reject: { label: 'Rechazar', icon: XCircle },
  inactive: { label: 'Inactivar', icon: PauseCircle },
};

export default function DocentesTable({ docentes, canManage, onAction }) {
  if (!docentes?.length) {
    return <div className="no-data">No hay docentes que coincidan con los filtros.</div>;
  }

  const getActions = (estado) => {
    const actions = actionsByEstado[estado] || ['view'];
    return canManage ? actions : ['view'];
  };

  return (
    <div className="table-wrapper docentes-table-wrapper">
      <table className="docentes-table">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Correo</th>
            <th>CI</th>
            <th>Materia habilitada</th>
            <th>Profesión / Especialidad</th>
            <th>Maestría</th>
            <th>Diplomado</th>
            <th>Estado</th>
            <th>Grupos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {docentes.map((docente) => {
            return (
              <tr key={docente.id}>
                <td>
                  <div className="docente-name">{getDocenteNombre(docente)}</div>
                  <div className="docente-muted">{docente.telefono || 'Sin teléfono'}</div>
                </td>
                <td>{getDocenteCorreo(docente)}</td>
                <td>{docente.ci || '-'}</td>
                <td>{materiaName(docente)}</td>
                <td>
                  <div>{docente.profesion || '-'}</div>
                  <div className="docente-muted">{docente.especialidad || '-'}</div>
                </td>
                <td><span className={docente.tiene_maestria ? 'yes-pill' : 'no-pill'}>{boolLabel(docente.tiene_maestria)}</span></td>
                <td><span className={docente.tiene_diplomado ? 'yes-pill' : 'no-pill'}>{boolLabel(docente.tiene_diplomado)}</span></td>
                <td><EstadoDocenteBadge estado={docente.estado_docente} /></td>
                <td><strong>{getGruposAsignadosDocente(docente)} / {getMaxGruposDocente(docente)}</strong></td>
                <td>
                  <div className="actions-cell">
                    {getActions(docente.estado_docente).map((action) => {
                      const meta = actionMeta[action];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={action}
                          className={`icon-btn docente-action-${action}`}
                          type="button"
                          title={meta.label}
                          onClick={() => onAction(action, docente)}
                        >
                          <Icon size={18} />
                        </button>
                      );
                    })}
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
