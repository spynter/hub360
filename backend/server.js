// Node.js server entry point
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const tourRoutes = require('./routes/tourRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api/tours', tourRoutes);
app.use('/api/upload', uploadRoutes);

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