export default function MateriaBadge({ estado }) {
  const map = {
    ACTIVA: 'materia-badge activa',
    INACTIVA: 'materia-badge inactiva',
  };

  return <span className={map[estado] || 'materia-badge inactiva'}>{estado}</span>;
}
