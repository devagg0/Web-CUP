import React from 'react';

export default function CupoBadge({ value, total }) {
  const available = Number(value ?? 0);
  const threshold = Math.max(1, Math.ceil((Number(total) || 0) * 0.2));
  const variant = available === 0 ? 'danger' : available <= threshold ? 'warning' : 'success';

  return <span className={`cupo-badge ${variant}`}>{available}</span>;
}
