import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const register = (username, password) => {
    const usersStr = localStorage.getItem('usersDB');
    let usersDB = usersStr ? JSON.parse(usersStr) : [];
    
    // Check if user already exists
    if (usersDB.find(u => u.username === username) || username === 'admin') {
      return { success: false, error: 'El usuario ya existe' };
    }

    const newUser = { username, password, role: 'user' };
    usersDB.push(newUser);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));
    
    // Auto login after registration
    setUser({ username: newUser.username, role: newUser.role });
    localStorage.setItem('user', JSON.stringify({ username: newUser.username, role: newUser.role }));
    return { success: true };
  };

  const login = (username, password) => {
    if (username === 'admin' && password === 'admin') {
      const adminUser = { username: 'admin', role: 'admin' };
      setUser(adminUser);
      localStorage.setItem('user', JSON.stringify(adminUser));
      return true;
    }
    
    const usersStr = localStorage.getItem('usersDB');
    const usersDB = usersStr ? JSON.parse(usersStr) : [];
    
    const foundUser = usersDB.find(u => u.username === username && u.password === password);
    if (foundUser) {
      const sessionUser = { username: foundUser.username, role: foundUser.role };
      setUser(sessionUser);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
