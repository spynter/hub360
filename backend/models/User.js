const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  usuario: { type: String, required: false, unique: true, sparse: true, trim: true },
  correo: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: false },
  tipo: { type: String, enum: ['consumidor', 'tienda', 'admin'], default: 'consumidor' },
  // Campos para autenticación social
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' }
});

// Hash de contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
