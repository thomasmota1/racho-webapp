import { Navigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import { Carregamento } from './Feedback.jsx';

export function RotaProtegida({ children, somenteAdministrador = false }) {
  const { usuario, carregando } = usarAutenticacao();

  if (carregando) return <Carregamento texto="Abrindo sua conta..." />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (somenteAdministrador && usuario.role !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
}
