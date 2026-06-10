import api from './api';

/**
 * Obtiene el resumen completo del dashboard administrativo CUP.
 * Llama a GET /api/admin/dashboard-cup/resumen
 */
export async function getDashboardCupResumen() {
  const response = await api.get('/admin/dashboard-cup/resumen');
  return response.data;
}

export default { getDashboardCupResumen };
