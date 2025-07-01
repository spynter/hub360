import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Interceptores para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default {
  // Operaciones CRUD para tours
  getTours: () => api.get('/tours'),
  getTour: (id) => api.get(`/tours/${id}`),
  createTour: (tour) => api.post('/tours', tour),
  updateTour: (id, tour) => api.put(`/tours/${id}`, tour),
  deleteTour: (id) => api.delete(`/tours/${id}`),
  
  // Subida de imágenes
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    // Devuelve la respuesta completa de Axios
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};