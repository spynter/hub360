const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Manejar preflight requests para CORS
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Ruta para subir imágenes
router.post('/', uploadController.uploadImage, uploadController.handleUpload);

module.exports = router;
