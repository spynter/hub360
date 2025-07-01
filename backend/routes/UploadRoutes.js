const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// Ruta para subir imágenes
router.post('/', uploadController.uploadImage, uploadController.handleUpload);

module.exports = router;