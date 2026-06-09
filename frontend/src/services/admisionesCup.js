import api from './api';

export const normalizePayload = (response) => response?.data ?? response ?? {};

export const normalizeList = (response) => {
  const payload = normalizePayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getBackendError = (error, fallback = 'Ocurrió un error al procesar la solicitud.') => {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  if (Array.isArray(data?.errores)) {
    return data.errores.map((item) => item?.mensaje || item?.error || item).join(' ');
  }
  return data?.message || data?.error || fallback;
};

export async function getResumenAdmisionesCup(params = {}) {
  const response = await api.get('/admin/admisiones-cup/resumen', { params });
  return response.data;
}

export async function getAdmisionesCup(params = {}) {
  const response = await api.get('/admin/admisiones-cup', { params });
  return response.data;
}

export async function getAdmisionCup(id) {
  const response = await api.get(`/admin/admisiones-cup/${id}`);
  return response.data;
}

export async function procesarAdmisionesCup() {
  const response = await api.post('/admin/admisiones-cup/procesar');
  return response.data;
}

export async function reprocesarAdmisionesCup() {
  const response = await api.post('/admin/admisiones-cup/reprocesar');
  return response.data;
}

export default {
  normalizePayload,
  normalizeList,
  getBackendError,
  getResumenAdmisionesCup,
  getAdmisionesCup,
  getAdmisionCup,
  procesarAdmisionesCup,
  reprocesarAdmisionesCup,
};
