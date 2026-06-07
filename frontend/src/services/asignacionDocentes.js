import api from './api';

export async function getResumenAsignacionesDocentes() {
  const response = await api.get('/admin/asignaciones-docentes/resumen');
  return response.data;
}

export async function getAsignacionesDocentes(params = {}) {
  const response = await api.get('/admin/asignaciones-docentes', { params });
  return response.data;
}

export async function getAsignacionDocente(id) {
  const response = await api.get(`/admin/asignaciones-docentes/${id}`);
  return response.data;
}

export async function getDocentesDisponibles(params = {}) {
  const response = await api.get('/admin/asignaciones-docentes/docentes-disponibles', { params });
  return response.data;
}

export async function crearAsignacionDocente(payload) {
  const response = await api.post('/admin/asignaciones-docentes', payload);
  return response.data;
}

export async function inactivarAsignacionDocente(id) {
  const response = await api.post(`/admin/asignaciones-docentes/${id}/inactivar`);
  return response.data;
}

export async function reactivarAsignacionDocente(id) {
  const response = await api.post(`/admin/asignaciones-docentes/${id}/reactivar`);
  return response.data;
}

export async function getMisGruposAsignadosDocente() {
  const response = await api.get('/docente/mis-grupos-asignados');
  return response.data;
}

export default {
  getResumenAsignacionesDocentes,
  getAsignacionesDocentes,
  getAsignacionDocente,
  getDocentesDisponibles,
  crearAsignacionDocente,
  inactivarAsignacionDocente,
  reactivarAsignacionDocente,
  getMisGruposAsignadosDocente,
};
