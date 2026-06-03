import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Grid } from 'lucide-react';
import escudo from '../assets/escudo-ficct.png';

export default function Sidebar() {
  const stored = sessionStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

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
        <Link to="/dashboard" className="nav-link">
          <Grid size={18} /> <span>Dashboard</span>
        </Link>
        {user?.role === 'admin' && (
          <Link to="/usuarios" className="nav-link">
            <Users size={18} /> <span>Usuarios y Roles</span>
          </Link>
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
