import api from './api';

export async function getUsers(params = {}) {
  const response = await api.get('/users', { params });
  return response.data;
}

export async function getUser(id) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

export async function createUser(payload) {
  const response = await api.post('/users', payload);
  return response.data;
}

export async function updateUser(id, payload) {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
}

export async function patchEstado(id, estado) {
  const response = await api.patch(`/users/${id}/estado`, { estado });
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

export async function getRoles() {
  const response = await api.get('/roles');
  return (response.data && response.data.data) || [];
}

export async function importarUsuarios(file) {
  const formData = new FormData();
  formData.append('archivo', file);
  const response = await api.post('/admin/users/importar', formData);
  return response.data;
}

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  patchEstado,
  deleteUser,
  getRoles,
  importarUsuarios,
};
