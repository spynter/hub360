import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Interceptor para agregar token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptores para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Si el token es inválido, redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
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
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  addHotspot: (tourId, sceneId, hotspotData) =>
    api.post(`/tours/${tourId}/scenes/${sceneId}/hotspots`, hotspotData),

  // Generar nueva API key para un tour
  generateApiKey: (tourId) =>
    api.post(`/tours/${tourId}/generate-key`).then(res => res.data),

  // Obtener tour por apiKey para embed
  getTourByApiKey: (apiKey) =>
    api.get(`/tours/by-key/${apiKey}`).then(res => res.data),

  // Productos (tienda)
  createProduct: (product) => api.post('/products', product),
  getProductCountByTour: async (tourId) => {
    // Devuelve solo el número de productos asociados a un tour
    const res = await api.get(`/products/by-tour/${tourId}/count`);
    return res.data.count || 0;
  },

  // Autenticación
  register: (userData) => api.post('/auth/register', userData),
  login: (loginData) => api.post('/auth/login', loginData),
};