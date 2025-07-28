const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, usuario: user.usuario, tipo: user.tipo },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { nombre, usuario, correo, password, tipo } = req.body;
    const user = new User({ nombre, usuario, correo, password, tipo });
    await user.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    const user = await User.findOne({ usuario });
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    
    const token = generateToken(user);
    res.json({ 
      message: 'Login exitoso', 
      token,
      user: { 
        nombre: user.nombre, 
        usuario: user.usuario, 
        correo: user.correo, 
        tipo: user.tipo, 
        _id: user._id,
        avatar: user.avatar,
        provider: user.provider
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Callback para autenticación social exitosa
exports.socialAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    
    // Redirigir al frontend con el token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      nombre: user.nombre,
      usuario: user.usuario,
      correo: user.correo,
      tipo: user.tipo,
      _id: user._id,
      avatar: user.avatar,
      provider: user.provider
    }))}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=Error en autenticación social`);
  }
};

// Obtener información del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
