import React from 'react';
import { LogOut } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, breadcrumb }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // ignore
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="breadcrumb">{breadcrumb}</div>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        <button className="btn-logout-small" onClick={handleLogout} title="Cerrar sesión">
          <LogOut />
        </button>
      </div>
    </header>
  );
}
