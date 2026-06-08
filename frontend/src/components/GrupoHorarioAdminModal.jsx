import { X } from 'lucide-react';
import EstadoGrupoBadge from './EstadoGrupoBadge';
import '../styles/grupoHorario.css';

const payloadOf = (response) => response?.data ?? response ?? {};
const text = (value, fallback = 'No registrado') => value || fallback;
const hour = (value) => String(value || '--:--').slice(0, 5);
const normalizeTextKey = (value) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const dayOrder = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
};

const getMateria = (row) => row?.materia || {};
const getDocente = (row) => row?.docente || {};
const getAula = (row) => row?.aula || {};

const docenteNombre = (docente) => {
  const nombreCompleto = [docente?.nombres, docente?.apellidos].filter(Boolean).join(' ');
  return text(docente?.nombre_completo || docente?.nombre || docente?.name || nombreCompleto || docente?.usuario?.name, 'Docente por confirmar');
};

const normalizeRow = (row) => {
  const materia = getMateria(row);
  const docente = getDocente(row);
  const aula = getAula(row);
  const dia = text(row?.dia_semana || row?.dia, 'Día pendiente');
  const turno = text(row?.turno, 'Turno pendiente');

  return {
    id: row?.id || `${dia}-${row?.hora_inicio}-${materia?.id || materia?.codigo}`,
    dia,
    diaKey: normalizeTextKey(dia),
    horaInicio: hour(row?.hora_inicio || row?.inicio),
    horaFin: hour(row?.hora_fin || row?.fin),
    materia: text(materia?.nombre || materia?.nombre_materia || row?.materia, 'Materia pendiente'),
    docente: docenteNombre(docente),
    aula: text(aula?.codigo || aula?.nombre || row?.aula, 'Aula por confirmar'),
    turno,
    turnoKey: normalizeTextKey(turno),
  };
};

const sortHorario = (items) => [...items].sort((a, b) => {
  const dayA = dayOrder[a.diaKey] || 99;
  const dayB = dayOrder[b.diaKey] || 99;
  if (dayA !== dayB) return dayA - dayB;
  return a.horaInicio.localeCompare(b.horaInicio);
});

export default function GrupoHorarioAdminModal({ detail, onClose }) {
  if (!detail) return null;

  const payload = payloadOf(detail);
  const grupo = payload?.grupo ?? null;
  const horario = sortHorario((Array.isArray(payload?.horario) ? payload.horario : []).map(normalizeRow));
  const resumen = payload?.resumen ?? {};
  const turnosValue = resumen.turnos ?? [...new Set(horario.map((item) => item.turno).filter(Boolean))];
  const turnos = Array.isArray(turnosValue) ? turnosValue.join(', ') : turnosValue;
  const totalMaterias = resumen.total_materias ?? horario.length;
  const totalClases = resumen.total_clases ?? resumen.total_bloques ?? horario.length;

  return (
    <div className="detail-modal-overlay grupo-modal-overlay" onClick={onClose}>
      <div className="detail-modal grupo-detail-modal grupo-horario-admin-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title-row">
          <div>
            <h3>Horario del grupo</h3>
            <p>Consulta de materias, docentes, aulas y turnos asignados.</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <section className="grupo-admin-summary">
          <div className="grupo-admin-main">
            <span>Grupo</span>
            <strong>{text(grupo?.codigo, 'Sin código')} - {text(grupo?.nombre, 'Sin nombre')}</strong>
          </div>
          <div><span>Capacidad máxima</span><strong>{grupo?.capacidad_maxima ?? 70}</strong></div>
          <div><span>Cantidad de estudiantes</span><strong>{grupo?.cantidad_estudiantes ?? 0}</strong></div>
          <div><span>Estado</span><EstadoGrupoBadge estado={grupo?.estado} /></div>
          <div><span>Total materias programadas</span><strong>{totalMaterias}</strong></div>
          <div><span>Total clases</span><strong>{totalClases}</strong></div>
          <div><span>Turnos</span><strong>{turnos || 'Sin turnos'}</strong></div>
        </section>

        {horario.length === 0 ? (
          <div className="grupo-empty">Este grupo aún no tiene horario asignado.</div>
        ) : (
          <div className="grupo-table-wrapper">
            <table className="grupo-horario-table admin">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Hora</th>
                  <th>Materia</th>
                  <th>Docente</th>
                  <th>Aula</th>
                  <th>Turno</th>
                </tr>
              </thead>
              <tbody>
                {horario.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.dia}</strong></td>
                    <td>{item.horaInicio} - {item.horaFin}</td>
                    <td>{item.materia}</td>
                    <td>{item.docente}</td>
                    <td>{item.aula}</td>
                    <td><span className={`grupo-turno-chip turno-${item.turnoKey || 'general'}`}>{item.turno}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
