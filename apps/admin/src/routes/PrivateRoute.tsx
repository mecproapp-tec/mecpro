import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blackBg text-neonBlue flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return admin ? <>{children}</> : <Navigate to="/login" />;
}
