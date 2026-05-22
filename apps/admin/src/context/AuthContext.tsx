import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  officeName?: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');
    if (token && storedAdmin) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('admin', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setAdmin(user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('admin');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}