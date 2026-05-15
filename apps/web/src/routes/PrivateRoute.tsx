// apps/web/src/routes/PrivateRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Props {
  children: ReactNode;
}

export default function PrivateRoute({ children }: Props) {
  const { user, isLoading, logout } = useAuth();
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsValid(false);
        setValidating(false);
        return;
      }

      try {
        await api.get("/auth/me");
        setIsValid(true);
      } catch (error: any) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userName");
          localStorage.removeItem("userRole");
          localStorage.removeItem("tenantId");
          logout();
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } finally {
        setValidating(false);
      }
    };

    if (!isLoading) {
      validateToken();
    }
  }, [isLoading, logout]);

  if (isLoading || validating) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user || !isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}