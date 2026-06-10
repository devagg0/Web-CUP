/**
 * AlertCard — Tarjeta de alerta inteligente
 * Props: tipo ('success' | 'info' | 'warning' | 'danger'), titulo, mensaje
 */
const ALERT_CONFIG = {
  success: { bg: '#f0fdf4', border: '#10b981', icon: '✓', color: '#065f46' },
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ', color: '#1e40af' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠', color: '#92400e' },
  danger:  { bg: '#fef2f2', border: '#ef4444', icon: '✕', color: '#991b1b' },
};

export default function AlertCard({ tipo = 'info', titulo, mensaje }) {
  const cfg = ALERT_CONFIG[tipo] ?? ALERT_CONFIG.info;

  return (
    <div
      className="alert-card"
      style={{
        background: cfg.bg,
        borderLeft: `4px solid ${cfg.border}`,
        color: cfg.color,
      }}
    >
      <div className="alert-card__header">
        <span className="alert-card__icon" style={{ background: cfg.border + '22', color: cfg.border }}>
          {cfg.icon}
        </span>
        <span className="alert-card__title" style={{ color: cfg.color }}>{titulo}</span>
      </div>
      <p className="alert-card__message">{mensaje}</p>
    </div>
  );
}
