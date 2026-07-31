import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Loading } from './Feedback.jsx';

export function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Abrindo sua conta..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}
