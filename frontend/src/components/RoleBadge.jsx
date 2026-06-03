import React from 'react';

export default function RoleBadge({ role }) {
  const map = {
    admin: 'role-admin',
    docente: 'role-docente',
    coordinador: 'role-coordinador',
    autoridad: 'role-autoridad',
  };

  return <span className={`role-badge ${map[role] || ''}`}>{role}</span>;
}
