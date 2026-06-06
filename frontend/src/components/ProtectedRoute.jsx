import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { validateToken } from '../services/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  const token = sessionStorage.getItem('token');
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!token) {
        if (mounted) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      const ok = await validateToken();
      if (mounted) {
        setAllowed(ok);
        setChecking(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [token]);

  if (checking) return null;
  if (!allowed) return <Navigate to="/login" replace />;

  let user = null;
  try {
    const stored = sessionStorage.getItem('user');
    user = stored ? JSON.parse(stored) : null;
  } catch (e) {
    user = null;
  }

  if (user?.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (!user?.debe_cambiar_password && location.pathname === '/cambiar-password') {
    return <Navigate to={user?.role === 'postulante' ? '/perfil-postulante' : '/dashboard'} replace />;
  }

  if (requiredRole) {
    const userRole = user?.role?.toLowerCase();
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole.map((role) => role.toLowerCase())
      : [requiredRole.toLowerCase()];

    if (!user || !allowedRoles.includes(userRole)) {
      return <Navigate to={user?.role === 'postulante' ? '/perfil-postulante' : '/dashboard'} replace />;
    }
  }

  return children;
}
