import api from './api';

export const getCarrerasPreinscripcion = () => api.get('/preinscripcion/carreras-activas');

export const enviarPreinscripcion = (formData) => api.post('/preinscripcion', formData, {
  headers: {
    Accept: 'application/json',
  },
});

export const consultarPreinscripcion = async (data) => {
  const response = await api.post('/preinscripcion/consultar', data, {
    headers: {
      Accept: 'application/json',
    },
  });
  
  // Log temporal para debug
  console.log('RESPUESTA CONSULTA PREINSCRIPCION:', response.data);
  
  // Normalizar la respuesta - puede venir en diferentes formatos
  const payload = response.data?.data || response.data?.postulante || response.data?.preinscripcion || response.data;
  
  return {
    ...response,
    data: payload,
  };
};

export const enviarComprobantePago = async (formData) => {
  const response = await api.post('/preinscripcion/pago', formData, {
    headers: {
      Accept: 'application/json',
    },
  });
  
  // Normalizar la respuesta
  const payload = response.data?.data || response.data?.postulante || response.data?.preinscripcion || response.data;
  
  return {
    ...response,
    data: payload,
  };
};

export const getAdminPreinscripciones = (params) => api.get('/admin/preinscripciones', { params });
export const getAdminPreinscripcion = (id) => api.get(`/admin/preinscripciones/${id}`);
export const importarPostulantes = (file) => {
  const formData = new FormData();
  formData.append('archivo', file);

  return api.post('/admin/preinscripciones/importar', formData, {
    headers: {
      Accept: 'application/json',
    },
  });
};
export const aprobarRequisitos = (id) => api.post(`/admin/preinscripciones/${id}/aprobar-requisitos`);
export const observarRequisitos = (id, observacion) => api.post(`/admin/preinscripciones/${id}/observar-requisitos`, { observacion });
export const aprobarPago = (id) => api.post(`/admin/preinscripciones/${id}/aprobar-pago`);
export const observarPago = (id, observacion) => api.post(`/admin/preinscripciones/${id}/observar-pago`, { observacion });
export const rechazarPreinscripcion = (id, observacion) => api.post(`/admin/preinscripciones/${id}/rechazar`, { observacion });
