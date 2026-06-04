import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Carreras from './pages/Carreras';
import Materias from './pages/Materias';
import Preinscripcion from './pages/Preinscripcion';
import AdminPreinscripciones from './pages/AdminPreinscripciones';
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
        if (ok) navigate('/dashboard', { replace: true });
        else navigate('/login', { replace: true });
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
        <Route
          path="/admin/preinscripciones"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPreinscripciones />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
