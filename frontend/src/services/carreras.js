import api from './api';

export async function getCarreras() {
  const response = await api.get('/carreras');
  return response.data;
}

export async function getCarrera(id) {
  const response = await api.get(`/carreras/${id}`);
  return response.data;
}

export async function createCarrera(payload) {
  const response = await api.post('/carreras', payload);
  return response.data;
}

export async function updateCarrera(id, payload) {
  const response = await api.put(`/carreras/${id}`, payload);
  return response.data;
}

export async function patchCarreraEstado(id, estado) {
  const response = await api.patch(`/carreras/${id}/estado`, { estado });
  return response.data;
}

export async function deleteCarrera(id) {
  const response = await api.delete(`/carreras/${id}`);
  return response.data;
}

export async function getCarrerasResumen() {
  const response = await api.get('/carreras/resumen');
  return response.data;
}

export default {
  getCarreras,
  getCarrera,
  createCarrera,
  updateCarrera,
  patchCarreraEstado,
  deleteCarrera,
  getCarrerasResumen,
};
