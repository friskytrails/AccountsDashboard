import { createContext, useContext, useState } from 'react';
import { getToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken() || 'mock-token');
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('accounts_user');
    return u ? JSON.parse(u) : { id: 'admin-01', name: 'Accounts Admin', email: 'accounts@friskytrails.com', role: 'finance_manager' };
  });

  function login(tokenValue, userData) {
    localStorage.setItem('accounts_token', tokenValue);
    localStorage.setItem('accounts_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('accounts_token');
    localStorage.removeItem('accounts_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
