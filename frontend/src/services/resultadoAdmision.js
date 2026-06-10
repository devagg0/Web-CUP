import api from './api';

export async function getMiResultadoAdmision() {
  const response = await api.get('/postulante/mi-resultado-admision');
  return response.data;
}

export default {
  getMiResultadoAdmision,
};
