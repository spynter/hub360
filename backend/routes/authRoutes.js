const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Rutas de autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas de autenticación con Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }), 
  authController.socialAuthCallback
);

// Rutas de autenticación con Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }), 
  authController.socialAuthCallback
);

// Ruta para obtener usuario actual (requiere autenticación)
router.get('/me', auth, authController.getCurrentUser);

// Ruta para verificar acceso de admin
router.get('/verify-admin', adminAuth, (req, res) => {
  res.json({ 
    message: 'Acceso de administrador verificado',
    user: req.user 
  });
});

module.exports = router;