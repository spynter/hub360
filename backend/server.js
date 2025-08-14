// Node.js server entry point
const dontenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const tourRoutes = require('./routes/tourRoutes');
const uploadRoutes = require('./routes/UploadRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

//dotenv
dontenv.config();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin o con origin 'null' (file://, apps móviles)
    if (!origin || origin === 'null') return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://6z8k0j86-3000.use2.devtunnels.ms',
      'https://turpialview-backend.onrender.com',
      'https://turpialview-backend.onrender.com/api',
      'https://turpialview-backend.onrender.com/api/tours',
    ];

    // Verificar si el origin está en la lista de permitidos o es onrender.com
    if (allowedOrigins.includes(origin) || origin.includes('onrender.com')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware adicional para manejar CORS manualmente
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://6z8k0j86-3000.use2.devtunnels.ms',
    'https://turpialview-backend.onrender.com'
  ];
  
  if (origin && (allowedOrigins.includes(origin) || origin.includes('onrender.com'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json());
// Servir archivos estáticos con CORS abierto para permitir texturas desde file://
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

// Conectar a MongoDB
connectDB();

// Configuración de sesiones para Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/api/tours', tourRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Tours 360° funcionando');
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Errores de Multer
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Algo salió mal' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});