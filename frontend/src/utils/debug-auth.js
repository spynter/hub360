// Script de debug para verificar URLs de autenticación
export const debugAuthUrls = () => {
  console.log('🔍 Debug de URLs de Autenticación:');
  
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  console.log('Base URL:', baseUrl);
  
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  console.log('API URL:', apiUrl);
  
  const googleUrl = `${apiUrl}/auth/google`;
  const facebookUrl = `${apiUrl}/auth/facebook`;
  
  console.log('Google Auth URL:', googleUrl);
  console.log('Facebook Auth URL:', facebookUrl);
  
  return {
    baseUrl,
    apiUrl,
    googleUrl,
    facebookUrl
  };
};

// Función para verificar si hay duplicación de /api
export const checkApiDuplication = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const hasApiInBase = baseUrl.includes('/api');
  
  console.log('🔍 Verificación de duplicación /api:');
  console.log('Base URL contiene /api:', hasApiInBase);
  console.log('Base URL completa:', baseUrl);
  
  if (hasApiInBase) {
    console.log('⚠️  ADVERTENCIA: La URL base ya contiene /api');
    console.log('Esto puede causar duplicación en las rutas de autenticación');
  }
  
  return hasApiInBase;
}; 