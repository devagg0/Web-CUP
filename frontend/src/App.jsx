import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Carreras from './pages/Carreras';
import Materias from './pages/Materias';
import GestionDocentes from './pages/GestionDocentes';
import GestionGruposCup from './pages/GestionGruposCup';
import AsignacionDocentes from './pages/AsignacionDocentes';
import CargaHorariaAulas from './pages/CargaHorariaAulas';
import MiPerfilDocente from './pages/MiPerfilDocente';
import MisGruposAsignadosDocente from './pages/MisGruposAsignadosDocente';
import MiCargaHorariaDocente from './pages/MiCargaHorariaDocente';
import MisAsistenciasDocente from './pages/MisAsistenciasDocente';
import Preinscripcion from './pages/Preinscripcion';
import ConsultaPreinscripcion from './pages/ConsultaPreinscripcion';
import AdminPreinscripciones from './pages/AdminPreinscripciones';
import AdminPagosPreinscripcion from './pages/AdminPagosPreinscripcion';
import CambiarPassword from './pages/CambiarPassword';
import PerfilPostulante from './pages/PerfilPostulante';
import ConsultarGrupoHorario from './pages/ConsultarGrupoHorario';
import EvaluacionesNotas from './pages/EvaluacionesNotas';
import MisNotasCup from './pages/MisNotasCup';
import ProtectedRoute from './components/ProtectedRoute';
import { validateToken } from './services/auth';

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const token = sessionStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return undefined;
    }

    validateToken().then((ok) => {
      if (!mounted) return;
      if (!ok) {
        navigate('/login', { replace: true });
        return;
      }

      let user;
      try {
        const stored = sessionStorage.getItem('user');
        user = stored ? JSON.parse(stored) : null;
      } catch {
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
}

function App() {
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
          path="/postulante/mi-grupo-horario"
          element={
            <ProtectedRoute requiredRole="postulante">
              <ConsultarGrupoHorario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/postulante/mis-notas"
          element={
            <ProtectedRoute requiredRole="postulante">
              <MisNotasCup />
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
        <Route
          path="/docentes"
          element={
            <ProtectedRoute requiredRole={['admin', 'administrador', 'coordinador', 'autoridad']}>
              <GestionDocentes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grupos-cup"
          element={
            <ProtectedRoute requiredRole={['admin', 'administrador', 'coordinador', 'autoridad']}>
              <GestionGruposCup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asignacion-docentes"
          element={
            <ProtectedRoute requiredRole={['admin', 'administrador', 'coordinador', 'autoridad']}>
              <AsignacionDocentes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carga-horaria-aulas"
          element={
            <ProtectedRoute requiredRole={['admin', 'administrador', 'coordinador', 'autoridad']}>
              <CargaHorariaAulas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluaciones-notas"
          element={
            <ProtectedRoute requiredRole={['admin', 'administrador', 'coordinador', 'docente', 'autoridad']}>
              <EvaluacionesNotas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docente/mi-perfil"
          element={
            <ProtectedRoute requiredRole="docente">
              <MiPerfilDocente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docente/mis-grupos"
          element={
            <ProtectedRoute requiredRole="docente">
              <MisGruposAsignadosDocente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docente/mi-carga-horaria"
          element={
            <ProtectedRoute requiredRole="docente">
              <MiCargaHorariaDocente />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docente/mis-asistencias"
          element={
            <ProtectedRoute requiredRole="docente">
              <MisAsistenciasDocente />
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
