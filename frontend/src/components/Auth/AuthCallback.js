import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(UserContext);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      console.error('Error en autenticación social:', error);
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Guardar usuario y token en contexto
        login(user, token);
        
        // Redirigir al hub
        navigate('/hub');
      } catch (error) {
        console.error('Error procesando datos de autenticación:', error);
        navigate('/login?error=Error procesando autenticación');
      }
    } else {
      navigate('/login?error=Datos de autenticación incompletos');
    }
  }, [location, navigate, login]);

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Procesando autenticación...</h2>
        <p style={{ textAlign: 'center', color: '#a3a3a3' }}>
          Por favor espera mientras completamos tu inicio de sesión.
        </p>
      </div>
    </div>
  );
}

export default AuthCallback; 