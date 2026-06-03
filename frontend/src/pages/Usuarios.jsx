import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UsuariosTable from '../components/UsuariosTable';
import UserForm from '../components/UserForm';
import StateBadge from '../components/StateBadge';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import RoleBadge from '../components/RoleBadge';
import * as usersService from '../services/users';
import '../styles/usuarios.css';

export default function Usuarios() {
  const [usersData, setUsersData] = useState({ data: [], meta: {} });
  const [roles, setRoles] = useState([]);
  const [filters, setFilters] = useState({ search: '', role: '', estado: '' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');

  const fetchRoles = async () => {
    try {
      const r = await usersService.getRoles();
      setRoles(r.filter((x) => x.nombre !== 'postulante'));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, search: filters.search || undefined, role: filters.role || undefined, estado: filters.estado || undefined };
      const res = await usersService.getUsers(params);
      setUsersData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchUsers(page); }, [page]);

  const handleSearch = () => { setPage(1); fetchUsers(1); };

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await usersService.updateUser(editing.id, payload);
        setMessage('Usuario actualizado correctamente');
      } else {
        await usersService.createUser(payload);
        setMessage('Usuario creado correctamente');
      }
      setFormOpen(false);
      fetchUsers(page);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user) => { setEditing(user); setFormOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('Confirmar desactivar usuario?')) return;
    try {
      await usersService.deleteUser(id);
      setMessage('Usuario desactivado');
      fetchUsers(page);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Error al desactivar');
    }
  };

  const handleChangeEstado = async (id, estado) => {
    try {
      await usersService.patchEstado(id, estado);
      setMessage('Estado actualizado');
      fetchUsers(page);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const users = usersData?.data || [];
  const meta = usersData || {};

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Gestión de Usuarios y Roles" breadcrumb="Usuarios / Gestión" />

        <div className="content-inner">
          <div className="info-box">Solo se gestionan usuarios internos (no se permiten postulantes desde este módulo).</div>

          <div className="stats-row">
            <StatCard title="Total usuarios" value={meta.total || users.length} accent="#003B73" />
            <StatCard title="Activos" value={users.filter(u=>u.estado==='ACTIVO').length} accent="#16A34A" />
            <StatCard title="Bloqueados" value={users.filter(u=>u.estado==='BLOQUEADO').length} accent="#DC2626" />
            <StatCard title="Roles" value={roles.length} accent="#0056B3" />
          </div>

          <div className="controls-row">
            <div className="filters">
              <input className="search" placeholder="Buscar por nombre o correo" value={filters.search} onChange={(e)=>setFilters({...filters, search: e.target.value})} />
              <select value={filters.role} onChange={(e)=>setFilters({...filters, role: e.target.value})}>
                <option value="">Todos los roles</option>
                {roles.map(r=> <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
              </select>
              <select value={filters.estado} onChange={(e)=>setFilters({...filters, estado: e.target.value})}>
                <option value="">Todos los estados</option>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="BLOQUEADO">BLOQUEADO</option>
              </select>
              <button className="btn-ghost" onClick={handleSearch}>Aplicar</button>
            </div>

            <div>
              <button className="btn-primary" onClick={handleCreate}>Nuevo usuario</button>
            </div>
          </div>

          {message && <div className="message">{message}</div>}

          <div className="table-wrapper">
            {loading ? <div>Cargando...</div> : <UsuariosTable users={users} onEdit={handleEdit} onDelete={handleDelete} onChangeEstado={handleChangeEstado} />}
          </div>

          <div className="pagination">
            <button disabled={!meta.prev_page_url} onClick={()=>{setPage((p)=>Math.max(1,p-1)); fetchUsers(page-1);}}>Anterior</button>
            <span>Página {meta.current_page || 1} / {meta.last_page || 1}</span>
            <button disabled={!meta.next_page_url} onClick={()=>{setPage((p)=>p+1); fetchUsers(page+1);}}>Siguiente</button>
          </div>

          <UserForm open={formOpen} onClose={()=>setFormOpen(false)} onSubmit={handleSubmit} initial={editing || {}} roles={roles} />
        </div>
      </main>
    </div>
  );
}
