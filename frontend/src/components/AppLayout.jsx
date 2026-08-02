import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import Logotipo from './Logo.jsx';
import Avatar from './Avatar.jsx';

export default function LayoutAplicacao() {
  const { usuario, sair } = usarAutenticacao();
  const localizacao = useLocation();
  const titulosPorRota = {
    '/': ['Visão geral', 'Acompanhe seus grupos e acertos.'],
    '/profile': ['Meu perfil', 'Atualize os dados da sua conta.'],
    '/admin': ['Administração', 'Consulte os dados cadastrados no sistema.'],
  };
  const [titulo, subtitulo] = localizacao.pathname.startsWith('/groups/')
    ? ['Detalhes do grupo', 'Despesas, pessoas, saldos e acertos.']
    : (titulosPorRota[localizacao.pathname] || ['Rachô', 'Despesas compartilhadas sem climão.']);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logotipo />
        <nav className="sidebar__nav">
          <NavLink to="/" end className={({ isActive: estaAtivo }) => `nav-item ${estaAtivo ? 'nav-item--active' : ''}`}>
            <span>⌂</span><span>Visão geral</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive: estaAtivo }) => `nav-item ${estaAtivo ? 'nav-item--active' : ''}`}>
            <span>☺</span><span>Meu perfil</span>
          </NavLink>
          {usuario.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive: estaAtivo }) => `nav-item ${estaAtivo ? 'nav-item--active' : ''}`}>
              <span>◇</span><span>Administração</span>
            </NavLink>
          )}
        </nav>
        <button className="sidebar__user" onClick={sair} title="Sair da conta">
          <Avatar nome={usuario.name} />
          <span>
            <strong>{usuario.name}</strong>
            <small>{usuario.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</small>
          </span>
          <b>↗</b>
        </button>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
