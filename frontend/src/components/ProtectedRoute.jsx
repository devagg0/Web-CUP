import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { validateToken } from '../services/auth';

export default function ProtectedRoute({ children, requiredRole }) {
  const token = sessionStorage.getItem('token');
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

  if (requiredRole) {
    try {
      const stored = sessionStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (!user || user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
      }
    } catch (e) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
