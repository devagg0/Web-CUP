import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos del usuario desde sessionStorage
    const storedUser = sessionStorage.getItem('user');
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

      // Limpiar sessionStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Redirigir a login
      navigate('/login');
    } catch (err) {
      // Incluso si hay error, limpiar sessionStorage y redirigir
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
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
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Header title="Panel del Sistema CUP" breadcrumb="Inicio / Dashboard" />

        <div className="content-inner">
          <div className="user-card card">
            <div className="card-header">
              <div className="user-avatar">
                <User size={40} />
              </div>
              <div className="card-title-group">
                <h2 className="card-title">Información del Usuario</h2>
                <p className="card-subtitle">Tus datos de acceso al sistema</p>
              </div>
            </div>

            <div className="user-info">
              <div className="info-item">
                <div className="info-label">
                  <User size={20} className="info-icon" />
                  <span>Nombre</span>
                </div>
                <p className="info-value">{user?.name || 'N/A'}</p>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Mail size={20} className="info-icon" />
                  <span>Correo Electrónico</span>
                </div>
                <p className="info-value">{user?.email || 'N/A'}</p>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Shield size={20} className="info-icon" />
                  <span>Rol</span>
                </div>
                <p className="info-value role-badge">{user?.role || 'N/A'}</p>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <CheckCircle size={20} className="info-icon" />
                  <span>Estado</span>
                </div>
                <p className={`info-value status-badge status-${user?.estado?.toLowerCase() || 'desconocido'}`}>{user?.estado || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="welcome-card card">
            <div className="welcome-content">
              <h3 className="welcome-title">Bienvenido al Sistema de Admisión CUP</h3>
              <p className="welcome-text">Has iniciado sesión correctamente como <strong>{user?.role}</strong>.</p>
              <p className="welcome-text secondary">Desde aquí podrás acceder a todas las funcionalidades del sistema según tu rol de usuario.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
