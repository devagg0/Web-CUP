import api from './api';

export async function getAulas(params = {}) {
  const response = await api.get('/admin/aulas', { params });
  return response.data;
}

export async function getAula(id) {
  const response = await api.get(`/admin/aulas/${id}`);
  return response.data;
}

export async function crearAula(payload) {
  const response = await api.post('/admin/aulas', payload);
  return response.data;
}

export async function actualizarAula(id, payload) {
  const response = await api.post(`/admin/aulas/${id}/actualizar`, payload);
  return response.data;
}

export async function inactivarAula(id) {
  const response = await api.post(`/admin/aulas/${id}/inactivar`);
  return response.data;
}

export async function activarAula(id) {
  const response = await api.post(`/admin/aulas/${id}/activar`);
  return response.data;
}

export async function getResumenCargaHoraria() {
  const response = await api.get('/admin/cargas-horarias/resumen');
  return response.data;
}

export async function getCargasHorarias(params = {}) {
  const response = await api.get('/admin/cargas-horarias', { params });
  return response.data;
}

export async function getCargaHoraria(id) {
  const response = await api.get(`/admin/cargas-horarias/${id}`);
  return response.data;
}

export async function crearCargaHoraria(payload) {
  const response = await api.post('/admin/cargas-horarias', payload);
  return response.data;
}

export async function actualizarCargaHoraria(id, payload) {
  const response = await api.post(`/admin/cargas-horarias/${id}/actualizar`, payload);
  return response.data;
}

export async function inactivarCargaHoraria(id) {
  const response = await api.post(`/admin/cargas-horarias/${id}/inactivar`);
  return response.data;
}

export async function activarCargaHoraria(id) {
  const response = await api.post(`/admin/cargas-horarias/${id}/activar`);
  return response.data;
}

export async function getAsignacionesDisponibles(params = {}) {
  const response = await api.get('/admin/cargas-horarias/asignaciones-disponibles', { params });
  return response.data;
}

export async function getAulasDisponibles(params = {}) {
  const response = await api.get('/admin/cargas-horarias/aulas-disponibles', { params });
  return response.data;
}

export async function getAsistenciasDocenteAdmin(params = {}) {
  const response = await api.get('/admin/asistencias-docente', { params });
  return response.data;
}

export async function getAsistenciaDocente(id) {
  const response = await api.get(`/admin/asistencias-docente/${id}`);
  return response.data;
}

export async function getMiCargaHoraria() {
  const response = await api.get('/docente/mi-carga-horaria');
  return response.data;
}

export async function registrarAsistenciaDocente(cargaId, payload) {
  const response = await api.post(`/docente/cargas-horarias/${cargaId}/registrar-asistencia`, payload);
  return response.data;
}

export async function getMisAsistenciasDocente(params = {}) {
  const response = await api.get('/docente/asistencias', { params });
  return response.data;
}

export default {
  getAulas,
  getAula,
  crearAula,
  actualizarAula,
  inactivarAula,
  activarAula,
  getResumenCargaHoraria,
  getCargasHorarias,
  getCargaHoraria,
  crearCargaHoraria,
  actualizarCargaHoraria,
  inactivarCargaHoraria,
  activarCargaHoraria,
  getAsignacionesDisponibles,
  getAulasDisponibles,
  getAsistenciasDocenteAdmin,
  getAsistenciaDocente,
  getMiCargaHoraria,
  registrarAsistenciaDocente,
  getMisAsistenciasDocente,
};
