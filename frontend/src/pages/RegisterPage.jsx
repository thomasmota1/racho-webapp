import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import Logotipo from '../components/Logo.jsx';
import { Feedback } from '../components/Feedback.jsx';

export default function PaginaCadastro() {
  const { cadastrar } = usarAutenticacao();
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      await cadastrar(formulario.nome, formulario.email, formulario.senha);
      navegar('/');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase auth-showcase--register">
        <Logotipo />
        <div className="auth-showcase__content">
          <span className="eyebrow">COMECE EM POUCOS PASSOS</span>
          <h1>Um lugar para cada gasto do grupo.</h1>
          <p>Crie um rolê, adicione pessoas e deixe o cálculo por nossa conta.</p>
          <ul className="feature-checks">
            <li><span>✓</span> Divisão igual entre participantes</li>
            <li><span>✓</span> Saldos atualizados automaticamente</li>
            <li><span>✓</span> Confirmação de pagamentos</li>
          </ul>
        </div>
      </section>
      <section className="auth-panel">
        <form className="auth-form" onSubmit={enviarFormulario}>
          <span className="mobile-logo"><Logotipo /></span>
          <div className="auth-form__heading">
            <span className="eyebrow">NOVA CONTA</span>
            <h2>Crie seu acesso</h2>
            <p>Contas novas são cadastradas como usuário comum.</p>
          </div>
          <Feedback>{erro}</Feedback>
          <label className="field">
            <span>Nome completo</span>
            <input
              value={formulario.nome}
              onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
              placeholder="Seu nome"
              required
            />
          </label>
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
              minLength="6"
              value={formulario.senha}
              onChange={(evento) => setFormulario({ ...formulario, senha: evento.target.value })}
              placeholder="Pelo menos 6 caracteres"
              required
            />
          </label>
          <button className="button button--primary button--full" disabled={enviando}>
            {enviando ? 'Criando...' : 'Criar conta'}
          </button>
          <p className="auth-switch">Já tem uma conta? <Link to="/login">Entrar</Link></p>
        </form>
      </section>
    </main>
  );
}
