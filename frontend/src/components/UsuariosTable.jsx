import React from 'react';
import StateBadge from './StateBadge';
import RoleBadge from './RoleBadge';
import { Edit3, Trash2, Slash } from 'lucide-react';

export default function UsuariosTable({ users, onEdit, onDelete, onChangeEstado }) {
  return (
    <div className="card table-card">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users && users.length ? users.map((u) => (
            <tr key={u.id}>
              <td className="user-cell">
                <div className="user-name">{u.name}</div>
              </td>
              <td>{u.email}</td>
              <td><RoleBadge role={u.role?.nombre} /></td>
              <td><StateBadge estado={u.estado} /></td>
              <td>{u.created_at}</td>
              <td className="actions-cell">
                <button title="Editar" className="icon-btn" onClick={() => onEdit(u)}><Edit3 size={16} /></button>
                <button title="Desactivar" className="icon-btn danger" onClick={() => onDelete(u.id)}><Trash2 size={16} /></button>
                <div className="estado-actions">
                  <button title="Activar" onClick={() => onChangeEstado(u.id, 'ACTIVO')} className="small">ACT</button>
                  <button title="Inactivar" onClick={() => onChangeEstado(u.id, 'INACTIVO')} className="small">INA</button>
                  <button title="Bloquear" onClick={() => onChangeEstado(u.id, 'BLOQUEADO')} className="small">BLO</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="no-data">No hay usuarios</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
