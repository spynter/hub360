import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import AccessDenied from '../AccessDenied/AccessDenied';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, requireAdmin = true }) => {
  const { user, token } = useContext(UserContext);
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !token) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      if (!requireAdmin) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Verificar si el usuario es admin
      if (user.tipo === 'admin') {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      
      setIsChecking(false);
    };

    checkAccess();
  }, [user, token, requireAdmin]);

  if (isChecking) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!user || !token) {
    // Redirigir a login si no hay usuario o token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.tipo !== 'admin') {
    // Mostrar acceso denegado para usuarios no admin
    return <AccessDenied />;
  }

  // Usuario autenticado y autorizado
  return children;
};

export default ProtectedRoute;