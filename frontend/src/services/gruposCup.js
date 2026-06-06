import api from './api';

export async function getResumenGruposCup() {
  const response = await api.get('/admin/grupos-cup/resumen');
  return response.data;
}

export async function getGruposCup() {
  const response = await api.get('/admin/grupos-cup');
  return response.data;
}

export async function getGrupoCup(id) {
  const response = await api.get(`/admin/grupos-cup/${id}`);
  return response.data;
}

export async function generarGruposCup() {
  const response = await api.post('/admin/grupos-cup/generar');
  return response.data;
}

export async function inactivarGrupoCup(id) {
  const response = await api.post(`/admin/grupos-cup/${id}/inactivar`);
  return response.data;
}

export default {
  getResumenGruposCup,
  getGruposCup,
  getGrupoCup,
  generarGruposCup,
  inactivarGrupoCup,
};
