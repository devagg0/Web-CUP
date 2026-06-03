import React from 'react';

export default function StateBadge({ estado }) {
  const map = {
    ACTIVO: 'state-badge activo',
    INACTIVO: 'state-badge inactivo',
    BLOQUEADO: 'state-badge bloqueado',
  };

  return <span className={map[estado] || 'state-badge inactivo'}>{estado}</span>;
}
