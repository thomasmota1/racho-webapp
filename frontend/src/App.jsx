// Importa rotas e páginas principais.
import { Navigate, Route, Routes } from 'react-router-dom';
import LayoutAplicacao from './components/AppLayout.jsx';
import { RotaProtegida } from './components/ProtectedRoute.jsx';
import PaginaLogin from './pages/LoginPage.jsx';
import PaginaCadastro from './pages/RegisterPage.jsx';
import PaginaPainel from './pages/DashboardPage.jsx';
import PaginaGrupo from './pages/GroupPage.jsx';
import PaginaAdministracao from './pages/AdminPage.jsx';
import PaginaPerfil from './pages/ProfilePage.jsx';
import { usarAutenticacao } from './contexts/AuthContext.jsx';

// Monta as rotas da aplicação.
export default function Aplicacao() {
  // Consulta o usuário autenticado.
  const { usuario } = usarAutenticacao();

  return (
    <Routes>
      {/* Define rotas públicas de acesso. */}
      <Route path="/login" element={usuario ? <Navigate to="/" /> : <PaginaLogin />} />
      <Route path="/register" element={usuario ? <Navigate to="/" /> : <PaginaCadastro />} />
      {/* Protege as páginas internas. */}
      <Route path="/" element={<RotaProtegida><LayoutAplicacao /></RotaProtegida>}>
        <Route index element={<PaginaPainel />} />
        <Route path="groups/:id" element={<PaginaGrupo />} />
        <Route path="profile" element={<PaginaPerfil />} />
        {/* Restringe o painel administrativo. */}
        <Route
          path="admin"
          element={(
            <RotaProtegida somenteAdministrador>
              <PaginaAdministracao />
            </RotaProtegida>
          )}
        />
      </Route>
      {/* Redireciona endereços desconhecidos. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
