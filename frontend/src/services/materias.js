import api from './api';

export async function getMaterias() {
  const response = await api.get('/materias');
  return response.data;
}

export async function getMateria(id) {
  const response = await api.get(`/materias/${id}`);
  return response.data;
}

export async function createMateria(payload) {
  const response = await api.post('/materias', payload);
  return response.data;
}

export async function updateMateria(id, payload) {
  const response = await api.put(`/materias/${id}`, payload);
  return response.data;
}

export async function patchMateriaEstado(id, estado) {
  const response = await api.patch(`/materias/${id}/estado`, { estado });
  return response.data;
}

export async function deleteMateria(id) {
  const response = await api.delete(`/materias/${id}`);
  return response.data;
}

export async function getMateriasResumen() {
  const response = await api.get('/materias/resumen');
  return response.data;
}

export default {
  getMaterias,
  getMateria,
  createMateria,
  updateMateria,
  patchMateriaEstado,
  deleteMateria,
  getMateriasResumen,
};
