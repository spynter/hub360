import React, { useState, useContext } from 'react';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { getGoogleAuthUrl, getFacebookAuthUrl } from '../../utils/auth';
import './Auth.css';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(UserContext);

  // Obtener la ruta de destino desde el estado de navegación
  const from = location.state?.from?.pathname || '/hub';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.login({ usuario, password });
      
      // Guardar usuario y token en el contexto
      login(res.data.user, res.data.token);
      
      // Redirigir a la ruta de destino o al hub por defecto
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Entrar'}
        </button>
        
        <div className="auth-divider">
          <span>o</span>
        </div>
        
        <div className="social-auth-buttons">
          <button 
            type="button" 
            className="social-auth-btn google-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <FaGoogle />
            Continuar con Google
          </button>
          <button 
            type="button" 
            className="social-auth-btn facebook-btn"
            onClick={handleFacebookAuth}
            disabled={isLoading}
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