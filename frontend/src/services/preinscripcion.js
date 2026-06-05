import api from './api';

export const getCarrerasPreinscripcion = () => api.get('/preinscripcion/carreras-activas');
export const enviarPreinscripcion = (formData) => api.post('/preinscripcion', formData, {
  headers: {
    Accept: 'application/json',
  },
});
export const consultarPreinscripcion = (data) => api.post('/preinscripcion/consultar', data, {
  headers: {
    Accept: 'application/json',
  },
});
export const enviarComprobantePago = (formData) => api.post('/preinscripcion/pago', formData, {
  headers: {
    Accept: 'application/json',
  },
});

export const getAdminPreinscripciones = (params) => api.get('/admin/preinscripciones', { params });
export const getAdminPreinscripcion = (id) => api.get(`/admin/preinscripciones/${id}`);
export const aprobarRequisitos = (id) => api.post(`/admin/preinscripciones/${id}/aprobar-requisitos`);
export const observarRequisitos = (id, observacion) => api.post(`/admin/preinscripciones/${id}/observar-requisitos`, { observacion });
export const aprobarPago = (id) => api.post(`/admin/preinscripciones/${id}/aprobar-pago`);
export const observarPago = (id, observacion) => api.post(`/admin/preinscripciones/${id}/observar-pago`, { observacion });
export const rechazarPreinscripcion = (id, observacion) => api.post(`/admin/preinscripciones/${id}/rechazar`, { observacion });
