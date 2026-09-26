import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('accounts_pass_auth') === 'true' && !!localStorage.getItem('accounts_token');
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accounts_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          logout();
        } else {
          return res.json().then(data => {
            if (data?.user) setUser(data.user);
          });
        }
      })
      .catch(() => {
        // If offline or network issue, maintain state if token exists
      });
  }, []);

  async function login(password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || 'Authentication failed' };
      }

      localStorage.setItem('accounts_pass_auth', 'true');
      localStorage.setItem('accounts_token', data.token);
      setIsAuthenticated(true);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Could not connect to authentication server' };
    }
  }

  function logout() {
    localStorage.removeItem('accounts_pass_auth');
    localStorage.removeItem('accounts_token');
    setIsAuthenticated(false);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
