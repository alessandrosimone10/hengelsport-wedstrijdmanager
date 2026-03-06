import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
};