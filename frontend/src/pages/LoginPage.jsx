import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { Feedback } from '../components/Feedback.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(type) {
    setForm(type === 'admin'
      ? { email: 'admin@racho.com', password: 'admin123' }
      : { email: 'ana@racho.com', password: '123456' });
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Logo />
        <div className="auth-showcase__content">
          <span className="eyebrow">DESPESAS COMPARTILHADAS</span>
          <h1>Feche as contas.<br />Não as amizades.</h1>
          <p>Organize gastos de viagens, churrascos, repúblicas e qualquer outro rolê.</p>
        </div>
        <small className="auth-showcase__footer">O Rachô registra acertos. Nenhum dinheiro é movimentado.</small>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="mobile-logo"><Logo /></span>
          <div className="auth-form__heading">
            <span className="eyebrow">BEM-VINDO DE VOLTA</span>
            <h2>Entre na sua conta</h2>
            <p>Seus grupos e despesas estão esperando.</p>
          </div>
          <Feedback>{error}</Feedback>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Sua senha" required />
          </label>
          <button className="button button--primary button--full" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
          <div className="demo-access">
            <p>Acessos para demonstração</p>
            <div>
              <button type="button" onClick={() => fillDemo('user')}>Entrar como Ana</button>
              <button type="button" onClick={() => fillDemo('admin')}>Entrar como admin</button>
            </div>
          </div>
          <p className="auth-switch">Ainda não tem uma conta? <Link to="/register">Criar conta</Link></p>
        </form>
      </section>
    </main>
  );
}
