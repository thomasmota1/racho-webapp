import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const titles = {
    '/': ['Visão geral', 'Acompanhe seus grupos e acertos.'],
    '/profile': ['Meu perfil', 'Atualize os dados da sua conta.'],
    '/admin': ['Administração', 'Controle completo da plataforma.'],
  };
  const [title, subtitle] = location.pathname.startsWith('/groups/')
    ? ['Detalhes do grupo', 'Despesas, pessoas, saldos e acertos.']
    : (titles[location.pathname] || ['Rachô', 'Despesas compartilhadas sem climão.']);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav className="sidebar__nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            <span>⌂</span><span>Visão geral</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            <span>☺</span><span>Meu perfil</span>
          </NavLink>
          {user.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
              <span>◇</span><span>Administração</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar__tip">
          <span>💡</span>
          <p>Registre os gastos enquanto ainda estão frescos.</p>
        </div>
        <button className="sidebar__user" onClick={logout} title="Sair da conta">
          <Avatar name={user.name} />
          <span>
            <strong>{user.name}</strong>
            <small>{user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</small>
          </span>
          <b>↗</b>
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar__badge">Sem pagamento real</div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
