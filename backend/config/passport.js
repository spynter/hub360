const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Configuración de Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente por Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Buscar usuario por email
    user = await User.findOne({ correo: profile.emails[0].value });
    
    if (user) {
      // Actualizar usuario existente con Google ID
      user.googleId = profile.id;
      user.provider = 'google';
      user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }
    
    // Crear nuevo usuario
    const newUser = new User({
      nombre: profile.displayName,
      correo: profile.emails[0].value,
      googleId: profile.id,
      provider: 'google',
      avatar: profile.photos[0]?.value,
      usuario: profile.emails[0].value.split('@')[0] + '_' + Date.now()
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Configuración de Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID || 'your-facebook-app-id',
  clientSecret: process.env.FACEBOOK_APP_SECRET || 'your-facebook-app-secret',
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente por Facebook ID
    let user = await User.findOne({ facebookId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Buscar usuario por email
    user = await User.findOne({ correo: profile.emails[0].value });
    
    if (user) {
      // Actualizar usuario existente con Facebook ID
      user.facebookId = profile.id;
      user.provider = 'facebook';
      user.avatar = profile.photos[0]?.value;
      await user.save();
      return done(null, user);
    }
    
    // Crear nuevo usuario
    const newUser = new User({
      nombre: profile.displayName,
      correo: profile.emails[0].value,
      facebookId: profile.id,
      provider: 'facebook',
      avatar: profile.photos[0]?.value,
      usuario: profile.emails[0].value.split('@')[0] + '_' + Date.now()
    });
    
    await newUser.save();
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialización del usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialización del usuario
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport; 