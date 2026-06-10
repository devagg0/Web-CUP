/**
 * MetricCard — Tarjeta de indicador principal
 * Props: title, value, icon, color, subtitle, compact
 */
export default function MetricCard({ title, value, icon: Icon, color = '#003B73', subtitle, compact = false }) {
  if (compact) {
    return (
      <div className="metric-card metric-card--compact" style={{ '--card-accent': color }}>
        <div className="metric-card__icon metric-card__icon--sm" style={{ background: color + '18', color }}>
          {Icon && <Icon size={16} />}
        </div>
        <div className="metric-card__compact-body">
          <div className="metric-card__value metric-card__value--sm" style={{ color }}>{value ?? 0}</div>
          <div className="metric-card__title metric-card__title--sm">{title}</div>
        </div>
        <div className="metric-card__accent-bar" style={{ background: color }} />
      </div>
    );
  }

  return (
    <div className="metric-card" style={{ '--card-accent': color }}>
      <div className="metric-card__header">
        <div className="metric-card__icon" style={{ background: color + '18', color }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
      <div className="metric-card__value" style={{ color }}>{value ?? 0}</div>
      <div className="metric-card__title">{title}</div>
      {subtitle && <div className="metric-card__subtitle">{subtitle}</div>}
      <div className="metric-card__accent-bar" style={{ background: color }} />
    </div>
  );
}
