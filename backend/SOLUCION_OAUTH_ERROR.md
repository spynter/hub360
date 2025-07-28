# 🔧 Solución al Error `redirect_uri_mismatch`

## ❌ Problema
```
Error 400: redirect_uri_mismatch
No puedes iniciar sesión porque esta aplicación ha enviado una solicitud no válida.
```

## ✅ Solución Paso a Paso

### 1. **Verificar Variables de Entorno**

Crea o actualiza tu archivo `.env` en el directorio `backend/` con estas variables:

```env
# URLs de la aplicación (CRÍTICO para OAuth)
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Configuración de JWT
JWT_SECRET=tu-super-secret-jwt-key

# Configuración de sesiones
SESSION_SECRET=tu-session-secret-key

# Google OAuth (ya configurado)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Facebook OAuth (opcional)
FACEBOOK_APP_ID=tu-facebook-app-id
FACEBOOK_APP_SECRET=tu-facebook-app-secret
```

### 2. **Configurar Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **"APIs & Services"** → **"Credentials"**
4. Encuentra tu **OAuth 2.0 Client ID** y haz clic en el lápiz para editarlo
5. En la sección **"Authorized redirect URIs"** agrega:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
6. Haz clic en **"Save"**

### 3. **Configurar Facebook Developers (Opcional)**

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Selecciona tu aplicación
3. Ve a **"Settings"** → **"Basic"**
4. En **"App Domains"** agrega: `localhost`
5. Ve a **"Facebook Login"** → **"Settings"**
6. En **"Valid OAuth Redirect URIs"** agrega:
   ```
   http://localhost:5000/api/auth/facebook/callback
   ```

### 4. **Verificar Configuración**

Ejecuta el script de verificación:
```bash
cd backend
node scripts/check-oauth-config.js
```

### 5. **Reiniciar Servidores**

1. Detén el servidor backend (Ctrl+C)
2. Detén el servidor frontend (Ctrl+C)
3. Reinicia el backend:
   ```bash
   cd backend
   npm start
   ```
4. Reinicia el frontend:
   ```bash
   cd frontend
   npm start
   ```

### 6. **Probar Autenticación**

1. Ve a `http://localhost:3000/login`
2. Haz clic en **"Continuar con Google"**
3. Deberías ser redirigido a Google y luego de vuelta a la aplicación

## 🔍 Verificaciones Importantes

### ✅ URLs Correctas
- **Google**: `http://localhost:5000/api/auth/google/callback`
- **Facebook**: `http://localhost:5000/api/auth/facebook/callback`

### ❌ Errores Comunes
- Usar `https://` en lugar de `http://` en desarrollo
- Espacios extra en las URLs
- Puerto incorrecto (debe ser 5000)
- URLs sin `/api/auth/` en el path

### 🔧 Debugging

Si el error persiste:

1. **Verifica la URL exacta** en Google Cloud Console
2. **Compara con la URL** que aparece en el script de verificación
3. **Revisa los logs** del servidor backend
4. **Verifica que el servidor** esté corriendo en puerto 5000

## 📞 Soporte

Si el problema persiste después de seguir estos pasos:

1. Ejecuta: `node scripts/check-oauth-config.js`
2. Copia la salida completa
3. Verifica que las URLs coincidan exactamente
4. Asegúrate de que no haya espacios o caracteres especiales

## 🚀 Próximos Pasos

Una vez que la autenticación funcione:

1. Configura Facebook OAuth si es necesario
2. Personaliza los estilos de los botones
3. Agrega manejo de errores más específico
4. Implementa logout y gestión de sesiones 