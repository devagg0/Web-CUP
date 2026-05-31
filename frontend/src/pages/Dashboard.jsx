import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Shield, CheckCircle } from 'lucide-react';
import api from '../services/api';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        setError('Error al cargar los datos del usuario.');
      }
    }
    setLoading(false);
  }, []);

  // Manejar logout
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // Llamar al endpoint de logout
      await api.post('/logout');

      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirigir a login
      navigate('/login');
    } catch (err) {
      // Incluso si hay error, limpiar localStorage y redirigir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">Panel del Sistema CUP</h1>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-logout"
            >
              <LogOut size={18} />
              {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="dashboard-content">
          {/* Tarjeta de Usuario */}
          <div className="user-card">
            <div className="card-header">
              <div className="user-avatar">
                <User size={40} />
              </div>
              <div className="card-title-group">
                <h2 className="card-title">Información del Usuario</h2>
                <p className="card-subtitle">Tus datos de acceso al sistema</p>
              </div>
            </div>

            {/* Información del Usuario */}
            <div className="user-info">
              {/* Nombre */}
              <div className="info-item">
                <div className="info-label">
                  <User size={20} className="info-icon" />
                  <span>Nombre</span>
                </div>
                <p className="info-value">{user?.name || 'N/A'}</p>
              </div>

              {/* Email */}
              <div className="info-item">
                <div className="info-label">
                  <Mail size={20} className="info-icon" />
                  <span>Correo Electrónico</span>
                </div>
                <p className="info-value">{user?.email || 'N/A'}</p>
              </div>

              {/* Rol */}
              <div className="info-item">
                <div className="info-label">
                  <Shield size={20} className="info-icon" />
                  <span>Rol</span>
                </div>
                <p className="info-value role-badge">
                  {user?.role || 'N/A'}
                </p>
              </div>

              {/* Estado */}
              <div className="info-item">
                <div className="info-label">
                  <CheckCircle size={20} className="info-icon" />
                  <span>Estado</span>
                </div>
                <p className={`info-value status-badge status-${user?.estado?.toLowerCase() || 'desconocido'}`}>
                  {user?.estado || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Bienvenida */}
          <div className="welcome-card">
            <div className="welcome-content">
              <h3 className="welcome-title">Bienvenido al Sistema de Admisión CUP</h3>
              <p className="welcome-text">
                Has iniciado sesión correctamente como <strong>{user?.role}</strong>.
              </p>
              <p className="welcome-text secondary">
                Desde aquí podrás acceder a todas las funcionalidades del sistema según tu rol de usuario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
