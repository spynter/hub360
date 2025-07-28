// Node.js server entry point
const dontenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const tourRoutes = require('./routes/tourRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

//dotenv
dontenv.config();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

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

// Conectar a MongoDB
connectDB();

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