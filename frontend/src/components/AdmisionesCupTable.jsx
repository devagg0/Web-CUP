import React from 'react';
import { Eye } from 'lucide-react';
import EstadoAdmisionBadge from './EstadoAdmisionBadge';

const text = (value) => value || 'No registrado';

const getCarreraNombre = (carrera) => {
  if (!carrera) return 'Sin carrera';
  if (typeof carrera === 'string') return carrera;
  if (typeof carrera === 'object') return carrera.nombre ?? carrera.descripcion ?? `Carrera ${carrera.id ?? ''}`;
  return String(carrera);
};

export default function AdmisionesCupTable({ admisiones = [], onView }) {
  const safeAdmisiones = Array.isArray(admisiones) ? admisiones : [];

  if (!safeAdmisiones.length) {
    return <div className="empty-state">No hay resultados de admisión para mostrar con los filtros seleccionados.</div>;
  }

  const getPostulanteNombre = (item) =>
    item?.postulante?.nombre_completo ||
    item?.postulante_nombre ||
    [item?.postulante?.nombres, item?.postulante?.apellidos].filter(Boolean).join(' ') ||
    'Sin nombre';

  const getCi = (item) => item?.postulante?.ci || item?.postulante_ci || item?.ci || 'Sin CI';
  
  const getPromedio = (item) =>
    item?.promedio !== undefined && item?.promedio !== null
      ? Number(item.promedio).toFixed(2)
      : '-';

  return (
    <div className="notas-table-wrapper admisiones-table-wrapper">
      <table className="notas-table admisiones-table">
        <thead>
          <tr>
            <th>Ranking</th>
            <th>Postulante</th>
            <th>CI</th>
            <th>Promedio CUP</th>
            <th>Estado académico</th>
            <th>1ra Carrera</th>
            <th>2da Carrera</th>
            <th>Carrera Asignada</th>
            <th>Estado Admisión</th>
            <th>Tipo Admisión</th>
            <th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {safeAdmisiones.map((item, index) => {
            if (!item) return null;
            const ranking = item?.posicion_ranking || item?.ranking || '-';
            const estadoAcademico = item?.estado_academico || 'PENDIENTE';
            const primeraCarrera = getCarreraNombre(item?.primera_carrera || item?.primera_carrera_nombre);
            const segundaCarrera = getCarreraNombre(item?.segunda_carrera || item?.segunda_carrera_nombre);
            const carreraAsignadaRaw = item?.carrera_asignada || item?.carrera_asignada_nombre;
            const carreraAsignada = carreraAsignadaRaw ? getCarreraNombre(carreraAsignadaRaw) : null;
            const estadoAdmision = item?.estado_admision || item?.estado || 'PENDIENTE';
            const tipoAdmision = item?.tipo_admision || 'Regular';

            return (
              <tr key={item?.id || `${getCi(item)}-${index}`}>
                <td>
                  <strong className={ranking !== '-' ? 'ranking-badge' : ''}>
                    {ranking}
                  </strong>
                </td>
                <td>
                  <strong>{getPostulanteNombre(item)}</strong>
                </td>
                <td>{text(getCi(item))}</td>
                <td>
                  <strong className="promedio-cell">{getPromedio(item)}</strong>
                </td>
                <td>
                  <span className={`estado-academico-label ${estadoAcademico.toLowerCase()}`}>
                    {estadoAcademico}
                  </span>
                </td>
                <td>{text(primeraCarrera)}</td>
                <td>{text(segundaCarrera)}</td>
                <td>
                  <strong className={carreraAsignada ? 'text-primary-color' : 'text-muted'}>
                    {carreraAsignada || 'Sin carrera asignada'}
                  </strong>
                </td>
                <td>
                  <EstadoAdmisionBadge estado={estadoAdmision} />
                </td>
                <td>{text(tipoAdmision)}</td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'center' }}>
                    <button
                      className="icon-action"
                      type="button"
                      onClick={() => onView?.(item)}
                      title="Ver detalle"
                    >
                      <Eye size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
