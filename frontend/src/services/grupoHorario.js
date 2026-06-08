import api from './api';

export const getMiGrupoHorario = () => api.get('/postulante/mi-grupo-horario');

export const getHorarioGrupoAdmin = (grupoId) => api.get(`/admin/grupos-cup/${grupoId}/horario`);
