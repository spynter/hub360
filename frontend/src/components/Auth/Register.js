import React, { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { getGoogleAuthUrl, getFacebookAuthUrl } from '../../utils/auth';
import { debugAuthUrls } from '../../utils/debug-auth';
import './Auth.css';

function Register() {
  const [form, setForm] = useState({
    nombre: '',
    usuario: '',
    correo: '',
    password: '',
    tipo: 'consumidor'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Enviar los datos al backend
      await api.register({
        nombre: form.nombre,
        usuario: form.usuario,
        correo: form.correo,
        password: form.password,
        tipo: form.tipo
      });
      setLoading(false);
      navigate('/login');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Error al registrar');
    }
  };

  const handleGoogleAuth = () => {
    // Debug para verificar la URL
    debugAuthUrls();
    const url = getGoogleAuthUrl();
    console.log('🚀 Redirigiendo a Google:', url);
    window.location.href = url;
  };

  const handleFacebookAuth = () => {
    // Debug para verificar la URL
    debugAuthUrls();
    const url = getFacebookAuthUrl();
    console.log('🚀 Redirigiendo a Facebook:', url);
    window.location.href = url;
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Registro de Usuario</h2>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="usuario"
          placeholder="Usuario"
          value={form.usuario}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="correo"
          placeholder="Correo"
          value={form.correo}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          required
        />
        <select name="tipo" value={form.tipo} onChange={handleChange}>
          <option value="consumidor">Consumidor</option>
          <option value="tienda">Tienda</option>
          <option value="admin">Admin</option>
        </select>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        
        <div className="auth-divider">
          <span>o</span>
        </div>
        
        <div className="social-auth-buttons">
          <button 
            type="button" 
            className="social-auth-btn google-btn"
            onClick={handleGoogleAuth}
          >
            <FaGoogle />
            Continuar con Google
          </button>
          <button 
            type="button" 
            className="social-auth-btn facebook-btn"
            onClick={handleFacebookAuth}
          >
            <FaFacebook />
            Continuar con Facebook
          </button>
        </div>
        
        <div className="auth-switch">
          ¿Ya tienes cuenta? <span onClick={() => navigate('/login')}>Inicia sesión</span>
        </div>
      </form>
    </div>
  );
}

export default Register;
