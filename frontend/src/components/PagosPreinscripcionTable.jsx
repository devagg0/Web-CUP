import EstadoPreinscripcionBadge from './EstadoPreinscripcionBadge';
import { Eye } from 'lucide-react';

export default function PagosPreinscripcionTable({ preinscripciones, onView, loading }) {
  if (loading) return <div className="loading-message">Cargando...</div>;
  if (!preinscripciones.length) return <div className="no-data">No hay solicitudes.</div>;

  return (
    <div className="table-wrapper preinscripciones-table-wrapper">
      <table className="preinscripciones-table">
        <thead>
          <tr>
            <th>CI</th>
            <th>Nombre completo</th>
            <th>Correo</th>
            <th>Carrera principal</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {preinscripciones.map((item) => {
            const nombre = `${item.nombres || ''} ${item.apellidos || ''}`.trim() || '—';
            const estado = String(item.estado_preinscripcion || item.estado || '').toUpperCase();
            const fecha = item.created_at || item.fecha || '—';
            const primera = item.primera_carrera?.nombre || item.primera_carrera || '—';

            return (
              <tr key={item.id}>
                <td>{item.ci || '—'}</td>
                <td>{nombre}</td>
                <td>{item.correo || '—'}</td>
                <td>{primera}</td>
                <td><EstadoPreinscripcionBadge estado={estado} /></td>
                <td>{fecha}</td>
                <td>
                  <div className="actions-cell">
                    <button className="icon-btn" type="button" title="Ver detalle" onClick={() => onView(item)}>
                      <Eye size={18} />
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
