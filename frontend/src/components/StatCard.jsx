import React from 'react';

export default function StatCard({ title, value, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={{ color: accent || '#003B73' }}>{value}</div>
    </div>
  );
}
