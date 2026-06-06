import api from './api';

export async function listarDocentes(params = {}) {
  const response = await api.get('/admin/docentes', { params });
  return response.data;
}

export async function obtenerDocente(id) {
  const response = await api.get(`/admin/docentes/${id}`);
  return response.data;
}

export async function obtenerDocentesHabilitados(params = {}) {
  const response = await api.get('/admin/docentes/habilitados', { params });
  return response.data;
}

export async function obtenerUsuariosDocentesDisponibles() {
  const response = await api.get('/admin/docentes/usuarios-disponibles');
  return response.data;
}

export async function crearDocente(formData) {
  const response = await api.post('/admin/docentes', formData);
  return response.data;
}

export async function actualizarDocente(id, formData) {
  const response = await api.post(`/admin/docentes/${id}/actualizar`, formData);
  return response.data;
}

export async function enviarRevisionDocente(id) {
  const response = await api.post(`/admin/docentes/${id}/enviar-revision`);
  return response.data;
}

export async function aprobarDocente(id) {
  const response = await api.post(`/admin/docentes/${id}/aprobar`);
  return response.data;
}

export async function observarDocente(id, observacion_admin) {
  const response = await api.post(`/admin/docentes/${id}/observar`, { observacion_admin });
  return response.data;
}

export async function rechazarDocente(id, observacion_admin) {
  const response = await api.post(`/admin/docentes/${id}/rechazar`, { observacion_admin });
  return response.data;
}

export async function inactivarDocente(id) {
  const response = await api.post(`/admin/docentes/${id}/inactivar`);
  return response.data;
}

export async function obtenerMiPerfilDocente() {
  const response = await api.get('/docente/mi-perfil');
  return response.data;
}

export async function guardarMiPerfilDocente(formData) {
  const response = await api.post('/docente/mi-perfil', formData);
  return response.data;
}

export async function enviarMiPerfilRevision() {
  const response = await api.post('/docente/mi-perfil/enviar-revision');
  return response.data;
}

export default {
  listarDocentes,
  obtenerDocente,
  obtenerDocentesHabilitados,
  obtenerUsuariosDocentesDisponibles,
  crearDocente,
  actualizarDocente,
  enviarRevisionDocente,
  aprobarDocente,
  observarDocente,
  rechazarDocente,
  inactivarDocente,
  obtenerMiPerfilDocente,
  guardarMiPerfilDocente,
  enviarMiPerfilRevision,
};
