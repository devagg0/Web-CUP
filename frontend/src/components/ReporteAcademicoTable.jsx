import React from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';

export default function ReporteAcademicoTable({ tipoReporte, data, loading }) {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>Cargando información del reporte...</p>
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="table-empty">
        <FileQuestion size={40} />
        <p>No hay datos disponibles para este reporte.</p>
      </div>
    );
  }

  const renderBadge = (val) => {
    if (!val) return 'N/A';
    const clean = val.toUpperCase().trim();
    let type = 'info';

    if (
      clean === 'INSCRITO' ||
      clean === 'ADMITIDO_PRIMERA_OPCION' ||
      clean === 'ADMITIDO_SEGUNDA_OPCION' ||
      clean === 'APROBADO' ||
      clean === 'ACTIVO'
    ) {
      type = 'success';
    } else if (
      clean === 'REPROBADO' ||
      clean === 'RECHAZADO' ||
      clean === 'INACTIVO'
    ) {
      type = 'danger';
    } else if (
      clean === 'PENDIENTE' ||
      clean === 'OBSERVADO' ||
      clean.includes('OBSERVADO') ||
      clean === 'APROBADO_SIN_CUPO'
    ) {
      type = 'warning';
    }

    return <span className={`badge-pill ${type}`}>{val}</span>;
  };

  // Render for each specific report type
  switch (tipoReporte) {
    case 'lista_general_postulantes':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>CI</th>
                <th>Nombre Completo</th>
                <th>Correo</th>
                <th>Primera Opción</th>
                <th>Segunda Opción</th>
                <th>Estado Preins.</th>
                <th>Grupo</th>
                <th>Fecha Inscr.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold">{row.ci}</td>
                  <td>{row.nombre_completo}</td>
                  <td>{row.correo}</td>
                  <td>{row.primera_carrera}</td>
                  <td>{row.segunda_carrera}</td>
                  <td>{renderBadge(row.estado)}</td>
                  <td className="cell-bold">{row.grupo_asignado}</td>
                  <td>{row.fecha_inscripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'postulantes_aprobados':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>CI</th>
                <th>Nombre Completo</th>
                <th className="cell-right">Promedio CUP</th>
                <th>Carrera Asignada</th>
                <th>Estado Admisión</th>
                <th>Grupo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold cell-center" style={{ color: '#003B73' }}>
                    #{row.ranking}
                  </td>
                  <td className="cell-bold">{row.ci}</td>
                  <td>{row.nombre_completo}</td>
                  <td className="cell-right cell-bold" style={{ color: '#16a34a' }}>
                    {parseFloat(row.promedio_final_cup).toFixed(2)}
                  </td>
                  <td className="cell-bold">{row.carrera_asignada}</td>
                  <td>{renderBadge(row.estado_admision)}</td>
                  <td>{row.grupo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'postulantes_reprobados':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>CI</th>
                <th>Nombre Completo</th>
                <th className="cell-right">Promedio CUP</th>
                <th>Materias Reprobadas</th>
                <th>Grupo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold">{row.ci}</td>
                  <td>{row.nombre_completo}</td>
                  <td className="cell-right cell-bold" style={{ color: '#dc2626' }}>
                    {parseFloat(row.promedio_final_cup).toFixed(2)}
                  </td>
                  <td style={{ color: '#dc2626', maxWidth: '300px', whiteSpace: 'normal' }}>
                    {row.materias_reprobadas}
                  </td>
                  <td>{row.grupo}</td>
                  <td>{renderBadge(row.estado_admision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'promedios_generales':
      // data is a structured object for promedios_generales
      return (
        <div className="promedios-generales-view">
          <div className="promedios-globales-cards">
            <div className="global-card">
              <span className="global-label">Promedio General CUP</span>
              <span className="global-value primary">{parseFloat(data.promedio_general_cup).toFixed(2)}</span>
            </div>
            <div className="global-card">
              <span className="global-label">Nota Más Alta</span>
              <span className="global-value success">{parseFloat(data.promedio_mas_alto).toFixed(2)}</span>
            </div>
            <div className="global-card">
              <span className="global-label">Nota Más Baja</span>
              <span className="global-value danger">{parseFloat(data.promedio_mas_bajo).toFixed(2)}</span>
            </div>
          </div>

          <div className="stats-breakdown-row">
            <div className="stats-indicator-card">
              <span className="indicator-title">Total Evaluados</span>
              <span className="indicator-value">{data.total_evaluados}</span>
            </div>
            <div className="stats-indicator-card text-success">
              <span className="indicator-title">Aprobados</span>
              <span className="indicator-value">{data.total_aprobados}</span>
            </div>
            <div className="stats-indicator-card text-danger">
              <span className="indicator-title">Reprobados</span>
              <span className="indicator-value">{data.total_reprobados}</span>
            </div>
            <div className="stats-indicator-card text-warning">
              <span className="indicator-title">Pendientes</span>
              <span className="indicator-value">{data.total_pendientes}</span>
            </div>
          </div>

          <div className="promedios-tables-split">
            <div className="promedios-section">
              <h4>Promedios y Estados por Grupo</h4>
              <div className="sub-table-wrapper">
                <table className="report-data-table compact">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th className="cell-right">Promedio Grupo</th>
                      <th className="cell-right text-success">Aprob.</th>
                      <th className="cell-right text-danger">Reprob.</th>
                      <th className="cell-right text-warning">Pend.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grupos && data.grupos.map((g, idx) => (
                      <tr key={idx}>
                        <td className="cell-bold">{g.grupo}</td>
                        <td className="cell-right cell-bold">{parseFloat(g.promedio_grupo).toFixed(2)}</td>
                        <td className="cell-right text-success cell-bold">{g.aprobados}</td>
                        <td className="cell-right text-danger cell-bold">{g.reprobados}</td>
                        <td className="cell-right text-warning">{g.pendientes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="promedios-section">
              <h4>Promedios e Inscripciones por Carrera</h4>
              <div className="sub-table-wrapper">
                <table className="report-data-table compact">
                  <thead>
                    <tr>
                      <th>Carrera</th>
                      <th className="cell-right">Promedio Asignados</th>
                      <th className="cell-right text-success">Admitidos</th>
                      <th className="cell-right text-warning">Aprob. S/Cupo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.carreras && data.carreras.map((c, idx) => (
                      <tr key={idx}>
                        <td className="cell-bold">{c.carrera}</td>
                        <td className="cell-right cell-bold">{parseFloat(c.promedio).toFixed(2)}</td>
                        <td className="cell-right text-success cell-bold">{c.admitidos}</td>
                        <td className="cell-right text-warning cell-bold">{c.aprobados_sin_cupo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );

    case 'grupos_habilitados':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre Grupo</th>
                <th className="cell-right">Capacidad Máxima</th>
                <th className="cell-right">Estudiantes Asignados</th>
                <th>Estado</th>
                <th>Fecha de Creación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold">{row.codigo}</td>
                  <td>{row.nombre}</td>
                  <td className="cell-right">{row.capacidad_maxima}</td>
                  <td className="cell-right cell-bold" style={{ color: '#003B73' }}>
                    {row.estudiantes_asignados}
                  </td>
                  <td>{renderBadge(row.estado)}</td>
                  <td>{row.fecha_creacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'estadisticas_materia':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th className="cell-right">Evaluados</th>
                <th className="cell-right text-success">Aprobados</th>
                <th className="cell-right text-danger">Reprobados</th>
                <th className="cell-right text-warning">Pendientes</th>
                <th className="cell-right">Promedio Materia</th>
                <th className="cell-right">Nota Máxima</th>
                <th className="cell-right">Nota Mínima</th>
                <th className="cell-right">% Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold">{row.materia}</td>
                  <td className="cell-right">{row.evaluados}</td>
                  <td className="cell-right text-success cell-bold">{row.aprobados}</td>
                  <td className="cell-right text-danger cell-bold">{row.reprobados}</td>
                  <td className="cell-right text-warning">{row.pendientes}</td>
                  <td className="cell-right cell-bold">{parseFloat(row.promedio_materia).toFixed(2)}</td>
                  <td className="cell-right">{parseFloat(row.nota_maxima).toFixed(2)}</td>
                  <td className="cell-right">{parseFloat(row.nota_minima).toFixed(2)}</td>
                  <td className="cell-right cell-bold" style={{ color: '#003B73', fontSize: '15px' }}>
                    {parseFloat(row.porcentaje_aprobacion).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'docentes_por_grupo':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Materia</th>
                <th>Docente</th>
                <th>Correo Docente</th>
                <th>Aula</th>
                <th>Día</th>
                <th className="cell-center">Horario</th>
                <th>Turno</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold">{row.grupo}</td>
                  <td>{row.materia}</td>
                  <td className="cell-bold" style={{ color: '#003B73' }}>
                    {row.docente}
                  </td>
                  <td>{row.correo_docente}</td>
                  <td>{row.aula}</td>
                  <td>{row.dia}</td>
                  <td className="cell-center">
                    {row.hora_inicio !== 'Sin asignar' 
                      ? `${row.hora_inicio.substring(0, 5)} - ${row.hora_fin.substring(0, 5)}`
                      : 'Sin asignar'}
                  </td>
                  <td>{row.turno}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'grupos_mayor_aprobados':
      return (
        <div className="report-table-wrapper">
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Grupo</th>
                <th className="cell-right">Total Estudiantes</th>
                <th className="cell-right text-success">Aprobados</th>
                <th className="cell-right text-danger">Reprobados</th>
                <th className="cell-right text-warning">Pendientes</th>
                <th className="cell-right">% Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="cell-bold cell-center" style={{ color: '#003B73' }}>
                    #{idx + 1}
                  </td>
                  <td className="cell-bold">{row.grupo}</td>
                  <td className="cell-right">{row.total_estudiantes}</td>
                  <td className="cell-right text-success cell-bold">{row.aprobados}</td>
                  <td className="cell-right text-danger cell-bold">{row.reprobados}</td>
                  <td className="cell-right text-warning">{row.pendientes}</td>
                  <td className="cell-right cell-bold" style={{ color: '#003B73', fontSize: '15px' }}>
                    {parseFloat(row.porcentaje_aprobacion).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return (
        <div className="table-empty">
          <AlertCircle size={40} />
          <p>Tipo de reporte no reconocido.</p>
        </div>
      );
  }
}
