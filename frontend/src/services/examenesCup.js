import api from './api';

export const normalizePayload = (response) => response?.data ?? response ?? {};

export const normalizeList = (response) => {
  const payload = normalizePayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.notas)) return payload.notas;
  if (Array.isArray(payload?.examenes)) return payload.examenes;
  if (Array.isArray(payload?.registros)) return payload.registros;
  return [];
};

export const normalizeMisNotas = (response) => {
  const payload = normalizePayload(response);
  const notas = Array.isArray(payload?.notas)
    ? payload.notas
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  return {
    ...payload,
    notas,
  };
};

export const getBackendError = (error, fallback = 'Ocurrio un error al procesar la solicitud.') => {
  const data = error?.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  if (Array.isArray(data?.errores)) {
    return data.errores.map((item) => item?.mensaje || item?.error || item).join(' ');
  }
  return data?.message || data?.error || fallback;
};

export async function getResumenExamenesCup(params = {}) {
  const response = await api.get('/admin/examenes-cup/resumen', { params });
  return response.data;
}

export async function getExamenesCup(params = {}) {
  const response = await api.get('/admin/examenes-cup', { params });
  return response.data;
}

export async function getNotasPostulanteAdmin(postulanteId) {
  const response = await api.get(`/admin/examenes-cup/${postulanteId}`);
  return response.data;
}

export async function registrarNotaCup(payload) {
  const response = await api.post('/admin/examenes-cup', payload);
  return response.data;
}

export async function actualizarNotaCup(id, payload) {
  const response = await api.put(`/admin/examenes-cup/${id}`, payload);
  return response.data;
}

export async function importarNotasCup(formData) {
  const response = await api.post('/admin/examenes-cup/importar', formData, {
    headers: {
      Accept: 'application/json',
    },
  });
  return response.data;
}

export async function getMisNotasCup() {
  const response = await api.get('/postulante/mis-notas-cup');
  return response.data;
}

export default {
  getResumenExamenesCup,
  getExamenesCup,
  getNotasPostulanteAdmin,
  registrarNotaCup,
  actualizarNotaCup,
  importarNotasCup,
  getMisNotasCup,
};
