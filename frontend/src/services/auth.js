import api from './api';

export async function validateToken() {
  const token = sessionStorage.getItem('token');
  if (!token) return false;

  try {
    const response = await api.get('/me');
    const userData = response.data && (response.data.user ?? response.data);
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return false;
  } catch (error) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return false;
  }
}

export async function cambiarPassword(data) {
  const response = await api.post('/cambiar-password', data);
  return response.data;
}

export default {
  validateToken,
  cambiarPassword,
};
