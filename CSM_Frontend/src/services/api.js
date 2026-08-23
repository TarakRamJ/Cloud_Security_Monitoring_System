import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080',
});

// Interceptor to attach Authorization header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Admin Request Endpoints
export const submitAdminRequest = async (type, title, details) => {
  const response = await API.post('/api/requests', { type, title, details });
  return response.data;
};

export const getMyRequests = async () => {
  const response = await API.get('/api/requests/my-requests');
  return response.data;
};

export const getAllAdminRequests = async () => {
  const response = await API.get('/api/requests');
  return response.data;
};

export const processAdminRequest = async (id, approve, comment) => {
  const response = await API.put(`/api/requests/${id}/process`, { approve, comment });
  return response.data;
};

export default API;