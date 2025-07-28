const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

console.log('🔍 Verificando configuración de OAuth...\n');

// Verificar variables de entorno
const requiredVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'BACKEND_URL',
  'FRONTEND_URL'
];

console.log('📋 Variables de entorno requeridas:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== `your-${varName.toLowerCase().replace(/_/g, '-')}`) {
    console.log(`✅ ${varName}: Configurado`);
  } else {
    console.log(`❌ ${varName}: No configurado o usando valor por defecto`);
  }
});

console.log('\n🌐 URLs de callback:');
console.log(`Google: ${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`);
console.log(`Facebook: ${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`);

console.log('\n📝 Instrucciones para Google Cloud Console:');
console.log('1. Ve a https://console.cloud.google.com/');
console.log('2. Selecciona tu proyecto');
console.log('3. Ve a "APIs & Services" > "Credentials"');
console.log('4. Edita tu OAuth 2.0 Client ID');
console.log('5. En "Authorized redirect URIs" agrega:');
console.log(`   ${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`);

console.log('\n📝 Instrucciones para Facebook Developers:');
console.log('1. Ve a https://developers.facebook.com/');
console.log('2. Selecciona tu aplicación');
console.log('3. Ve a "Settings" > "Basic"');
console.log('4. En "App Domains" agrega: localhost');
console.log('5. Ve a "Facebook Login" > "Settings"');
console.log('6. En "Valid OAuth Redirect URIs" agrega:');
console.log(`   ${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`);

console.log('\n⚠️  Solución común al error redirect_uri_mismatch:');
console.log('- Verifica que las URLs en Google/Facebook coincidan exactamente');
console.log('- No uses https:// en desarrollo local');
console.log('- Asegúrate de que no haya espacios extra');
console.log('- Verifica que el puerto sea correcto (5000)');

console.log('\n🚀 Para probar la configuración:');
console.log('1. Ejecuta: npm start (en el backend)');
console.log('2. Ejecuta: npm start (en el frontend)');
console.log('3. Ve a: http://localhost:3000/login');
console.log('4. Haz clic en "Continuar con Google" o "Continuar con Facebook"'); 