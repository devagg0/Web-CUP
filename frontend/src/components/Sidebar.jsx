import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Grid, BookOpen, Layers, ClipboardList, GraduationCap, UserRound, UsersRound } from 'lucide-react';
import escudo from '../assets/escudo-ficct.png';

export default function Sidebar() {
  const stored = sessionStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role?.toLowerCase();
  const canViewDocentes = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);
  const canViewGruposCup = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        <img src={escudo} alt="Escudo" className="sidebar-escudo" />
        <div className="brand">
          <h2>Sistema CUP</h2>
          <small>FICCT - UAGRM</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <Grid size={18} /> <span>Dashboard</span>
        </NavLink>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/usuarios" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Users size={18} /> <span>Usuarios y Roles</span>
            </NavLink>
            <NavLink to="/carreras" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <BookOpen size={18} /> <span>Carreras y Cupos</span>
            </NavLink>
            <NavLink to="/materias" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Layers size={18} /> <span>Materias del CUP</span>
            </NavLink>
            <NavLink to="/admin/preinscripciones" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ClipboardList size={18} /> <span>Preinscripciones CUP</span>
            </NavLink>
            <NavLink to="/admin/pagos-preinscripcion" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ClipboardList size={18} /> <span>Pagos CUP</span>
            </NavLink>
          </>
        )}
        {canViewDocentes && (
          <NavLink to="/docentes" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <GraduationCap size={18} /> <span>Docentes</span>
          </NavLink>
        )}
        {canViewGruposCup && (
          <NavLink to="/grupos-cup" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <UsersRound size={18} /> <span>Grupos CUP</span>
          </NavLink>
        )}
        {role === 'docente' && (
          <NavLink to="/docente/mi-perfil" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <UserRound size={18} /> <span>Mi perfil docente</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-mini">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <div className="user-name">{user?.name || 'Usuario'}</div>
            <div className="user-role">{user?.role || ''}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
