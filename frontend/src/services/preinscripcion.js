import api from './api';

export const getCarrerasActivas = () => api.get('/preinscripcion/carreras-activas');
export const submitPreinscripcion = (formData) => api.post('/preinscripcion', formData, {
  headers: {
    Accept: 'application/json',
  },
});

export const getAdminPreinscripciones = () => api.get('/admin/preinscripciones');
export const getAdminPreinscripcionById = (id) => api.get(`/admin/preinscripciones/${id}`);
export const approvePreinscripcion = (id) => api.post(`/admin/preinscripciones/${id}/aprobar`);
export const observePreinscripcion = (id, observacion) => api.post(`/admin/preinscripciones/${id}/observar`, { observacion });
export const rejectPreinscripcion = (id, observacion) => api.post(`/admin/preinscripciones/${id}/rechazar`, { observacion });
