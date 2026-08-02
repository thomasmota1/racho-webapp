// Importa recursos da autenticação.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import Logotipo from '../components/Logo.jsx';
import { Feedback } from '../components/Feedback.jsx';

// Exibe o formulário de entrada.
export default function PaginaLogin() {
  // Obtém autenticação e navegação.
  const { entrar } = usarAutenticacao();
  const navegar = useNavigate();
  // Controla formulário, erro e envio.
  const [formulario, setFormulario] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Envia as credenciais informadas.
  async function enviarFormulario(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);

    // Autentica e redireciona usuário.
    try {
      await entrar(formulario.email, formulario.senha);
      navegar('/');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  // Preenche credenciais de demonstração.
  function preencherAcessoDemonstracao(tipo) {
    setFormulario(tipo === 'administrador'
      ? { email: 'admin@racho.com', senha: 'admin123' }
      : { email: 'ana@racho.com', senha: '123456' });
  }

  return (
    <main className="auth-page">
      {/* Apresenta a proposta do sistema. */}
      <section className="auth-showcase">
        <Logotipo />
        <div className="auth-showcase__content">
          <span className="eyebrow">DESPESAS COMPARTILHADAS</span>
          <h1>Feche as contas.<br />Não as amizades.</h1>
          <p>Organize gastos de viagens, churrascos, repúblicas e qualquer outro rolê.</p>
        </div>
      </section>

      {/* Exibe o formulário de acesso. */}
      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviarFormulario}>
          <span className="mobile-logo"><Logotipo /></span>
          <div className="auth-form__heading">
            <span className="eyebrow">BEM-VINDO DE VOLTA</span>
            <h2>Entre na sua conta</h2>
            <p>Seus grupos e despesas estão esperando.</p>
          </div>
          <Feedback>{erro}</Feedback>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={formulario.email}
              onChange={(evento) => setFormulario({ ...formulario, email: evento.target.value })}
              placeholder="voce@email.com"
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={formulario.senha}
              onChange={(evento) => setFormulario({ ...formulario, senha: evento.target.value })}
              placeholder="Sua senha"
              required
            />
          </label>
          <button className="button button--primary button--full" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
          <div className="demo-access">
            <p>Acessos para demonstração</p>
            <div>
              <button type="button" onClick={() => preencherAcessoDemonstracao('usuario')}>Entrar como Ana</button>
              <button type="button" onClick={() => preencherAcessoDemonstracao('administrador')}>Entrar como admin</button>
            </div>
          </div>
          <p className="auth-switch">Ainda não tem uma conta? <Link to="/register">Criar conta</Link></p>
        </form>
      </section>
    </main>
  );
}
