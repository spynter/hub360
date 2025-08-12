// Upload controller logic goes here
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que el directorio uploads existe
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitizar el nombre del archivo
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

exports.uploadImage = upload.single('image');

exports.handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    // Construir la URL completa de la imagen
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({ 
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error en handleUpload:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la imagen' });
  }
};