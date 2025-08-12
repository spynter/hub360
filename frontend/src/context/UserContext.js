import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Intenta cargar usuario y token de localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        
        // Verificar si el token sigue siendo válido
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        clearStoredData();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      // Configurar el token en el header de la API
      api.setAuthToken(tokenToVerify);
      
      // Verificar el token con el backend
      const response = await api.getCurrentUser();
      
      if (response.data) {
        // Token válido, actualizar usuario si es necesario
        setUser(response.data);
        setToken(tokenToVerify);
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', tokenToVerify);
      } else {
        // Token inválido
        clearStoredData();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      clearStoredData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearStoredData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    api.removeAuthToken();
    setIsLoading(false);
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    api.setAuthToken(authToken);
  };

  const logout = () => {
    clearStoredData();
  };

  const isAuthenticated = () => {
    return !!(user && token);
  };

  const isAdmin = () => {
    return user && user.tipo === 'admin';
  };

  const hasRole = (role) => {
    return user && user.tipo === role;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      token, 
      isLoading,
      login, 
      logout, 
      isAuthenticated,
      isAdmin,
      hasRole
    }}>
      {children}
    </UserContext.Provider>
  );
}