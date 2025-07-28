// Función para obtener la URL base correcta para autenticación social
export const getAuthUrl = (provider) => {
  // Usar siempre la URL base sin /api para evitar duplicación
  const baseUrl = 'http://localhost:5000';
  return `${baseUrl}/api/auth/${provider}`;
};

// URLs específicas para cada proveedor
export const getGoogleAuthUrl = () => getAuthUrl('google');
export const getFacebookAuthUrl = () => getAuthUrl('facebook'); 