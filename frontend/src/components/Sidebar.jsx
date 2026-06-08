import { NavLink } from 'react-router-dom';
import { Users, Grid, BookOpen, Layers, ClipboardList, GraduationCap, UserRound, UsersRound, UserCheck, CalendarCheck, Clock } from 'lucide-react';
import escudo from '../assets/escudo-ficct.png';

export default function Sidebar() {
  const stored = sessionStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const role = user?.role?.toLowerCase();
  const canViewDocentes = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);
  const canViewGruposCup = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);
  const canViewAsignacionesDocentes = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);
  const canViewCargaHorariaAulas = ['admin', 'administrador', 'coordinador', 'autoridad'].includes(role);
  const canViewEvaluacionesNotas = ['admin', 'administrador', 'coordinador', 'docente', 'autoridad'].includes(role);

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
        {canViewAsignacionesDocentes && (
          <NavLink to="/asignacion-docentes" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <UserCheck size={18} /> <span>Asignación de docentes</span>
          </NavLink>
        )}
        {canViewCargaHorariaAulas && (
          <NavLink to="/carga-horaria-aulas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <CalendarCheck size={18} /> <span>Carga horaria y aulas</span>
          </NavLink>
        )}
        {canViewEvaluacionesNotas && (
          <NavLink to="/evaluaciones-notas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <ClipboardList size={18} /> <span>Evaluaciones y notas</span>
          </NavLink>
        )}
        {role === 'docente' && (
          <NavLink to="/docente/mi-perfil" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <UserRound size={18} /> <span>Mi perfil docente</span>
          </NavLink>
        )}
        {role === 'docente' && (
          <NavLink to="/docente/mis-grupos" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <UsersRound size={18} /> <span>Mis grupos asignados</span>
          </NavLink>
        )}
        {role === 'docente' && (
          <NavLink to="/docente/mi-carga-horaria" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <Clock size={18} /> <span>Mi carga horaria</span>
          </NavLink>
        )}
        {role === 'docente' && (
          <NavLink to="/docente/mis-asistencias" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <CalendarCheck size={18} /> <span>Mis asistencias</span>
          </NavLink>
        )}
        {role === 'postulante' && (
          <NavLink to="/postulante/mi-grupo-horario" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <Clock size={18} /> <span>Mi horario</span>
          </NavLink>
        )}
        {role === 'postulante' && (
          <NavLink to="/postulante/mis-notas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            <GraduationCap size={18} /> <span>Mis notas</span>
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
