import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
  },
});

// Interceptor para agregar el token Bearer a cada request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (no autorizado), limpiar sessionStorage y redirigir a login
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper para normalizar URLs de archivos
export const normalizeFileUrl = (url) => {
  if (!url) return null;
  
  const STORAGE_BASE_URL = 'http://localhost:8000';
  
  // Si ya tiene http://localhost/storage, cambiar a puerto 8000
  if (url.startsWith('http://localhost/storage')) {
    return url.replace('http://localhost', STORAGE_BASE_URL);
  }
  
  // Si empieza con /storage, agregar la base URL
  if (url.startsWith('/storage')) {
    return `${STORAGE_BASE_URL}${url}`;
  }
  
  // Si empieza con storage, agregar base URL con /
  if (url.startsWith('storage')) {
    return `${STORAGE_BASE_URL}/${url}`;
  }
  
  // Si ya es una URL completa válida, devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return url;
};

export default api;
