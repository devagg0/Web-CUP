import React from 'react';
import { Trophy, Award, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function EstadoResultadoAdmisionBadge({ estado }) {
  let label = 'Pendiente';
  let className = 'badge-pendiente';
  let Icon = Clock;

  switch (estado) {
    case 'ADMITIDO_PRIMERA_OPCION':
      label = 'Admitido 1ra opción';
      className = 'badge-admitido-primera';
      Icon = Trophy;
      break;
    case 'ADMITIDO_SEGUNDA_OPCION':
      label = 'Admitido 2da opción';
      className = 'badge-admitido-segunda';
      Icon = Award;
      break;
    case 'APROBADO_SIN_CUPO':
      label = 'Aprobado sin cupo';
      className = 'badge-aprobado-sin-cupo';
      Icon = AlertTriangle;
      break;
    case 'REPROBADO':
      label = 'Reprobado';
      className = 'badge-reprobado';
      Icon = XCircle;
      break;
    case 'PENDIENTE':
    default:
      label = 'Pendiente';
      className = 'badge-pendiente';
      Icon = Clock;
      break;
  }

  return (
    <span className={`resultado-badge ${className}`}>
      <Icon size={16} className="badge-icon" />
      <span>{label}</span>
    </span>
  );
}
