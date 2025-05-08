// src/context/AuthContext.tsx
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = (email: string, password: string) => {
    if (email && password) {
      setUser(email);
      localStorage.setItem('user', email);
      navigate('/dashboard');
    }
  };

  const signup = (email: string, password: string) => {
    if (email && password) {
      setUser(email);
      localStorage.setItem('user', email);
      navigate('/dashboard');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(storedUser);
  });

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this to the same file if you prefer not to split files
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};