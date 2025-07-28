# Configuración de Autenticación Social - Hub360

## Descripción

Se ha implementado un sistema completo de autenticación social que permite a los usuarios registrarse e iniciar sesión usando Google y Facebook, además de la autenticación tradicional con email y contraseña.

## Características Implementadas

### 🔐 Autenticación Múltiple
- **Autenticación Local**: Email/Usuario + Contraseña
- **Google OAuth**: Inicio de sesión con cuenta de Google
- **Facebook OAuth**: Inicio de sesión con cuenta de Facebook
- **JWT Tokens**: Autenticación basada en tokens JWT

### 📱 Interfaz de Usuario
- Botones de autenticación social en Login y Register
- Diseño responsive y moderno
- Manejo de errores y estados de carga
- Callback automático después de autenticación social

### 🗄️ Base de Datos
- Modelo de usuario actualizado con campos sociales
- Soporte para múltiples proveedores de autenticación
- Avatares y información de perfil social

## Configuración Requerida

### 1. Variables de Entorno

Crear un archivo `.env` en el directorio `backend/` con las siguientes variables:

```env
# Configuración de la base de datos
MONGODB_URI=mongodb://localhost:27017/hub360

# Configuración del servidor
PORT=5000
NODE_ENV=development

# Configuración de JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuración de sesiones
SESSION_SECRET=your-session-secret-key-change-this-in-production

# Configuración del frontend
FRONTEND_URL=http://localhost:3000

# Configuración de Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Configuración de Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### 2. Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credenciales" y crea una nueva credencial OAuth 2.0
5. **IMPORTANTE**: Configura las URIs de redirección autorizadas:
   - `http://localhost:5000/api/auth/google/callback` (desarrollo)
   - `https://tu-dominio.com/api/auth/google/callback` (producción)
6. Copia el Client ID y Client Secret a tu archivo `.env`

**⚠️ Solución al Error `redirect_uri_mismatch`:**
- Asegúrate de que la URI de redirección en Google Cloud Console coincida exactamente con: `http://localhost:5000/api/auth/google/callback`
- No uses `https://` en desarrollo local
- Verifica que no haya espacios extra o caracteres especiales
- Si usas un puerto diferente, actualiza tanto Google Console como tu `.env`

### 3. Configuración de Facebook OAuth

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. En la configuración de la app, agrega las URIs de redirección:
   - `http://localhost:5000/api/auth/facebook/callback` (desarrollo)
   - `https://tu-dominio.com/api/auth/facebook/callback` (producción)
4. Copia el App ID y App Secret a tu archivo `.env`

**⚠️ Solución al Error `redirect_uri_mismatch`:**
- Asegúrate de que la URI de redirección en Facebook Developers coincida exactamente con: `http://localhost:5000/api/auth/facebook/callback`
- No uses `https://` en desarrollo local
- Verifica que no haya espacios extra o caracteres especiales
- Si usas un puerto diferente, actualiza tanto Facebook Developers como tu `.env`

## Estructura de Archivos

### Backend
```
backend/
├── config/
│   ├── db.js
│   └── passport.js          # Configuración de Passport
├── controllers/
│   └── authController.js     # Controladores de autenticación
├── middleware/
│   └── auth.js              # Middleware JWT
├── models/
│   └── User.js              # Modelo de usuario actualizado
├── routes/
│   └── authRoutes.js        # Rutas de autenticación
└── server.js                # Servidor principal
```

### Frontend
```
frontend/src/
├── components/
│   └── Auth/
│       ├── Login.js         # Componente de login
│       ├── Register.js      # Componente de registro
│       ├── AuthCallback.js  # Callback de autenticación social
│       └── Auth.css         # Estilos de autenticación
├── services/
│   └── api.js              # Servicio de API con JWT
└── context/
    └── UserContext.js       # Contexto de usuario
```

## Funcionalidades

### 🔑 Autenticación Local
- Registro con email, usuario y contraseña
- Login con usuario/email y contraseña
- Validación de campos requeridos
- Hashing seguro de contraseñas

### 🌐 Autenticación Social
- **Google**: OAuth 2.0 con scope de perfil y email
- **Facebook**: OAuth 2.0 con scope de email
- Manejo automático de usuarios existentes
- Creación de nuevos usuarios con datos sociales

### 🎨 Interfaz de Usuario
- Botones de autenticación social con iconos
- Diseño consistente con el tema de la aplicación
- Estados de carga y manejo de errores
- Navegación automática después del login

### 🔒 Seguridad
- Tokens JWT con expiración de 7 días
- Middleware de autenticación para rutas protegidas
- Interceptores de API para manejo automático de tokens
- Redirección automática en caso de token inválido

## Flujo de Autenticación

### 1. Autenticación Local
```
Usuario → Formulario → API → Validación → JWT Token → Redirección al Hub
```

### 2. Autenticación Social
```
Usuario → Botón Social → OAuth Provider → Callback → Crear/Actualizar Usuario → JWT Token → Redirección al Hub
```

## Uso

### Para Usuarios
1. **Registro Local**: Llenar formulario con datos personales
2. **Login Local**: Usar email/usuario y contraseña
3. **Login Social**: Hacer clic en "Continuar con Google" o "Continuar con Facebook"

### Para Desarrolladores
1. Configurar variables de entorno
2. Configurar aplicaciones OAuth en Google y Facebook
3. Ejecutar el servidor backend y frontend
4. Probar autenticación en `/login` y `/register`

## Próximas Mejoras

1. **Perfil de Usuario**: Página para editar información personal
2. **Avatar**: Subida y gestión de imágenes de perfil
3. **Recuperación de Contraseña**: Sistema de reset por email
4. **Verificación de Email**: Confirmación de cuenta por email
5. **Roles y Permisos**: Sistema avanzado de autorización
6. **Logout**: Cerrar sesión en todos los dispositivos
7. **Autenticación de Dos Factores**: 2FA para mayor seguridad

## Notas Técnicas

- Los usuarios sociales no requieren contraseña
- Los avatares se obtienen automáticamente de los proveedores sociales
- El sistema maneja automáticamente usuarios existentes por email
- Los tokens JWT se almacenan en localStorage del navegador
- El middleware de autenticación protege rutas que requieren login 