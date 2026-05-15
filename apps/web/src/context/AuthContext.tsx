// apps/web/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, logout as apiLogout, getCurrentUser } from "../services/api";

interface User {
  id: number;
  email: string;
  name: string;
  officeName?: string | null;
  role?: string;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega dados mínimos do localStorage (sem dados sensíveis)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");
    const tenantId = localStorage.getItem("tenantId");

    if (token && userName) {
      setUser({
        id: 0,
        name: userName,
        email: "",
        role: userRole || "OWNER",
        tenantId: tenantId || undefined,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await apiLogin({ email, password });
    // Busca dados completos do usuário na API (não armazena em localStorage)
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    // O redirecionamento será feito no componente que chamar logout
  };

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  }, [user]);

  const isAuthenticated = !!user && !!localStorage.getItem("token");

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, refreshUser, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}