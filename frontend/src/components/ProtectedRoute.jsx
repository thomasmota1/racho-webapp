// Importa redirecionamento e autenticação.
import { Navigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import { Carregamento } from './Feedback.jsx';

// Restringe páginas conforme a sessão.
export function RotaProtegida({ children, somenteAdministrador = false }) {
  // Consulta usuário e carregamento.
  const { usuario, carregando } = usarAutenticacao();

  // Trata cada estado de acesso.
  if (carregando) return <Carregamento texto="Abrindo sua conta..." />;
  if (!usuario) return <Navigate to="/login" replace />;
  if (somenteAdministrador && usuario.role !== 'ADMIN') return <Navigate to="/" replace />;

  // Libera o conteúdo autorizado.
  return children;
}
