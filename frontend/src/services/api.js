import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Variable para almacenar el token actual
let authToken = null;

// Interceptor para agregar token JWT a las peticiones
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
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
    
    // Si el token es inválido, limpiar datos locales
    if (error.response?.status === 401) {
      authToken = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Solo redirigir si no estamos en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Métodos para manejar el token de autenticación
const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const removeAuthToken = () => {
  authToken = null;
  localStorage.removeItem('token');
};

const getAuthToken = () => {
  return authToken || localStorage.getItem('token');
};

export default {
  // Métodos de autenticación
  setAuthToken,
  removeAuthToken,
  getAuthToken,
  
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
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000, // 30 segundos de timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Progreso de upload:', percentCompleted + '%');
      }
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
  
  // Verificar usuario actual
  getCurrentUser: () => api.get('/auth/me'),
  
  // Verificar si el usuario es admin
  verifyAdminAccess: () => api.get('/auth/verify-admin'),
};