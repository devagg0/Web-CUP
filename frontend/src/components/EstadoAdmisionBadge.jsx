import React from 'react';

const normalizeEstado = (estado) => String(estado || '').toUpperCase();

export default function EstadoAdmisionBadge({ estado }) {
  const value = normalizeEstado(estado);
  
  let label = 'PENDIENTE';
  let className = 'estado-badge admision-badge pendiente';

  switch (value) {
    case 'ADMITIDO_PRIMERA_OPCION':
      label = 'Admitido 1ra opción';
      className = 'estado-badge admision-badge admitido-primera';
      break;
    case 'ADMITIDO_SEGUNDA_OPCION':
      label = 'Admitido 2da opción';
      className = 'estado-badge admision-badge admitido-segunda';
      break;
    case 'APROBADO_SIN_CUPO':
      label = 'Aprobado sin cupo';
      className = 'estado-badge admision-badge aprobado-sin-cupo';
      break;
    case 'REPROBADO':
      label = 'Reprobado';
      className = 'estado-badge admision-badge reprobado';
      break;
    case 'PENDIENTE':
    default:
      label = 'Pendiente';
      className = 'estado-badge admision-badge pendiente';
      break;
  }

  return <span className={className}>{label}</span>;
}
