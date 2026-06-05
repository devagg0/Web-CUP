import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Carreras from './pages/Carreras';
import Materias from './pages/Materias';
import Preinscripcion from './pages/Preinscripcion';
import ConsultaPreinscripcion from './pages/ConsultaPreinscripcion';
import AdminPreinscripciones from './pages/AdminPreinscripciones';
import AdminPagosPreinscripcion from './pages/AdminPagosPreinscripcion';
import CambiarPassword from './pages/CambiarPassword';
import PerfilPostulante from './pages/PerfilPostulante';
import ProtectedRoute from './components/ProtectedRoute';
import { validateToken } from './services/auth';

function App() {
  const RootRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
      let mounted = true;
      const token = sessionStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      validateToken().then((ok) => {
        if (!mounted) return;
        if (!ok) {
          navigate('/login', { replace: true });
          return;
        }

        let user = null;
        try {
          const stored = sessionStorage.getItem('user');
          user = stored ? JSON.parse(stored) : null;
        } catch (e) {
          user = null;
        }
        if (user?.debe_cambiar_password) {
          navigate('/cambiar-password', { replace: true });
        } else if (user?.role === 'postulante') {
          navigate('/perfil-postulante', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      });

      return () => {
        mounted = false;
      };
    }, [navigate]);

    return null;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/cambiar-password"
          element={
            <ProtectedRoute>
              <CambiarPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil-postulante"
          element={
            <ProtectedRoute>
              <PerfilPostulante />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute requiredRole="admin">
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carreras"
          element={
            <ProtectedRoute requiredRole="admin">
              <Carreras />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materias"
          element={
            <ProtectedRoute requiredRole="admin">
              <Materias />
            </ProtectedRoute>
          }
        />
        <Route path="/preinscripcion" element={<Preinscripcion />} />
        <Route path="/consultar-preinscripcion" element={<ConsultaPreinscripcion />} />
        <Route
          path="/admin/preinscripciones"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPreinscripciones />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pagos-preinscripcion"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPagosPreinscripcion />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
