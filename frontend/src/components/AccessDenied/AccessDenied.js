import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied = () => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">🚫</div>
        <h1 className="access-denied-title">Ruta Protegida</h1>
        <p className="access-denied-message">
          No tienes permisos para acceder a esta sección.
        </p>
        <p className="access-denied-submessage">
          Se requiere rol de administrador para acceder al Hub.
        </p>
        <div className="access-denied-countdown">
          <p>Redirigiendo en:</p>
          <span className="countdown-number">{countdown}</span>
          <p>segundos</p>
        </div>
        <div className="access-denied-actions">
          <button 
            className="access-denied-btn primary"
            onClick={() => navigate('/')}
          >
            Ir al Inicio
          </button>
          <button 
            className="access-denied-btn secondary"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;