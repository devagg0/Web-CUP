import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calculator, 
  FolderHeart, 
  BookOpenCheck, 
  GraduationCap, 
  TrendingUp 
} from 'lucide-react';

const reportTypes = [
  {
    id: 'lista_general_postulantes',
    name: 'Lista general de postulantes',
    description: 'Ver datos e inscripciones generales de postulantes.',
    icon: Users,
    color: '#003B73'
  },
  {
    id: 'postulantes_aprobados',
    name: 'Postulantes aprobados',
    description: 'Postulantes admitidos o aprobados sin cupo por ranking.',
    icon: UserCheck,
    color: '#16a34a'
  },
  {
    id: 'postulantes_reprobados',
    name: 'Postulantes reprobados',
    description: 'Postulantes reprobados según regla académica (parcial < 60).',
    icon: UserX,
    color: '#dc2626'
  },
  {
    id: 'promedios_generales',
    name: 'Promedios generales',
    description: 'Promedio general del proceso y listado por grupo / carrera.',
    icon: Calculator,
    color: '#2563eb'
  },
  {
    id: 'grupos_habilitados',
    name: 'Cantidad de grupos habilitados',
    description: 'Estado, capacidad y estudiantes asignados a grupos.',
    icon: FolderHeart,
    color: '#475569'
  },
  {
    id: 'estadisticas_materia',
    name: 'Estadísticas por materia',
    description: 'Rendimiento, nota máxima, mínima y porcentaje de aprobación.',
    icon: BookOpenCheck,
    color: '#d97706'
  },
  {
    id: 'docentes_por_grupo',
    name: 'Docentes por grupos',
    description: 'Docentes, materias, aulas y horarios asignados.',
    icon: GraduationCap,
    color: '#8b5cf6'
  },
  {
    id: 'grupos_mayor_aprobados',
    name: 'Grupos con mayor cantidad de aprobados',
    description: 'Ordenación de grupos según rendimiento de aprobados.',
    icon: TrendingUp,
    color: '#ec4899'
  }
];

export default function ReporteTipoSelector({ selectedType, onSelect }) {
  return (
    <div className="report-selector-container">
      <h3>Seleccionar Reporte</h3>
      <div className="report-options-list">
        {reportTypes.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedType === item.id;
          
          return (
            <button
              key={item.id}
              className={`report-option-btn ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <div 
                className="icon-wrapper" 
                style={{ 
                  backgroundColor: isSelected ? '#ffffff' : `${item.color}15`,
                  color: isSelected ? item.color : item.color
                }}
              >
                <Icon size={18} />
              </div>
              <div className="report-info">
                <span className="report-name">{item.name}</span>
                <span className="report-desc">{item.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
