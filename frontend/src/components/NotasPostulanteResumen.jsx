import { BookOpenCheck, GraduationCap, Medal, Sigma } from 'lucide-react';
import EstadoCupBadge from './EstadoCupBadge';

const CUP_MATERIAS = ['Computacion', 'Matematicas', 'Ingles', 'Fisica'];

const estadoClase = (estado) => {
  const normalized = String(estado || 'PENDIENTE').toUpperCase();
  if (normalized === 'APROBADO') return 'notice success';
  if (normalized === 'REPROBADO') return 'notice danger';
  return 'notice warning';
};

export default function NotasPostulanteResumen({ notas = [], promedio, estadoFinal }) {
  const evaluadas = notas.length;
  const aprobadas = notas.filter((nota) => String(nota.estado_materia || nota.estado || '').toUpperCase() === 'APROBADO').length;
  const estado = String(estadoFinal || 'PENDIENTE').toUpperCase();

  return (
    <>
      <div className="notas-summary-grid">
        <div className="notas-summary-card">
          <Sigma size={22} />
          <span>Promedio final CUP</span>
          <strong>{promedio == null ? 'Pendiente' : Number(promedio).toFixed(2)}</strong>
        </div>
        <div className="notas-summary-card">
          <GraduationCap size={22} />
          <span>Estado academico</span>
          <strong><EstadoCupBadge estado={estado} /></strong>
        </div>
        <div className="notas-summary-card">
          <BookOpenCheck size={22} />
          <span>Materias evaluadas</span>
          <strong>{evaluadas} / {CUP_MATERIAS.length}</strong>
        </div>
        <div className="notas-summary-card">
          <Medal size={22} />
          <span>Materias aprobadas</span>
          <strong>{aprobadas}</strong>
        </div>
      </div>

      <div className={estadoClase(estado)}>
        {estado === 'APROBADO' && 'Has aprobado academicamente el CUP.'}
        {estado === 'REPROBADO' && 'No aprobaste academicamente el CUP.'}
        {estado !== 'APROBADO' && estado !== 'REPROBADO' && 'Aun faltan materias por evaluar.'}
      </div>
    </>
  );
}
