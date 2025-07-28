import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { getGoogleAuthUrl, getFacebookAuthUrl } from '../../utils/auth';
import './Auth.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login({ usuario, password });
      login(res.data.user); // Guarda usuario en contexto
      navigate('/hub');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleFacebookAuth = () => {
    window.location.href = getFacebookAuthUrl();
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit">Entrar</button>
        
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
          ¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate</span>
        </div>
      </form>
    </div>
  );
}

export default Login;
