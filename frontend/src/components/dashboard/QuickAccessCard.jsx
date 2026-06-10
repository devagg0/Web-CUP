import { useNavigate } from 'react-router-dom';

/**
 * QuickAccessCard — Acceso rápido a módulos del sistema
 * Props: title, description, icon, route, color
 */
export default function QuickAccessCard({ title, description, icon: Icon, route, color = '#003B73' }) {
  const navigate = useNavigate();

  return (
    <button
      className="quick-access-card"
      onClick={() => navigate(route)}
      style={{ '--qa-color': color, borderTop: `2px solid ${color}` }}
      type="button"
    >
      <div className="quick-access-card__icon" style={{ background: color + '15', color }}>
        {Icon && <Icon size={18} />}
      </div>
      <div className="quick-access-card__body">
        <div className="quick-access-card__title">{title}</div>
        {description && (
          <div className="quick-access-card__desc">{description}</div>
        )}
      </div>
      <span className="quick-access-card__arrow" style={{ color }}>→</span>
    </button>
  );
}
