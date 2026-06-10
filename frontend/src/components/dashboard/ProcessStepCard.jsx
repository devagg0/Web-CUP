/**
 * ProcessStepCard — Tarjeta de etapa del proceso CUP
 * Props: step, title, value, icon, color, isLast
 */
export default function ProcessStepCard({ step, title, value, icon: Icon, color = '#003B73', isLast = false }) {
  return (
    <div className="process-step">
      <div className="process-step__connector-wrap">
        <div className="process-step__bubble" style={{ background: color }}>
          <span className="process-step__number">{step}</span>
        </div>
        {!isLast && <div className="process-step__line" />}
      </div>
      <div className="process-step__card" style={{ borderLeft: `3px solid ${color}` }}>
        <div className="process-step__icon" style={{ color }}>
          {Icon && <Icon size={18} />}
        </div>
        <div className="process-step__info">
          <div className="process-step__label">{title}</div>
          <div className="process-step__value" style={{ color }}>{value ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
