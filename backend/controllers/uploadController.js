// Upload controller logic goes here
const multer = require('multer');
const path = require('path');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

exports.uploadImage = upload.single('image');

exports.handleUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  
  res.json({ 
    imageUrl: `/uploads/${req.file.filename}` 
  });
};