import React, { createContext, useState, useContext, useEffect } from 'react';
import { routesAPI } from '../services/routesAPI';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u) => {
    if (!u) return null;
    // Compatibilidad: backend ahora usa `role`, el frontend históricamente usaba `role`
    return { ...u, role: u.role ?? u.role };
  };

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await routesAPI.getMe(token);
          setUser(normalizeUser(userData));
        } catch (error) {
          console.error("Error recuperando usuario:", error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await routesAPI.login(credentials);
    setToken(data.token);
    setUser(normalizeUser(data.user));
    localStorage.setItem('token', data.token);
    return data;
  };

  const register = async (userData) => {
    return await routesAPI.register(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Refresca el usuario desde la API. Lo usan flujos como upload de avatar
  // que cambian datos en el backend y necesitan que el contexto refleje el
  // nuevo estado sin re-loguear.
  const refreshUser = async () => {
    if (!token) return null;
    const userData = await routesAPI.getMe(token);
    const normalized = normalizeUser(userData);
    setUser(normalized);
    return normalized;
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
