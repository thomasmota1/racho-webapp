import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import { Feedback } from '../components/Feedback.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase auth-showcase--register">
        <Logo />
        <div className="auth-showcase__content">
          <span className="eyebrow">COMECE EM POUCOS PASSOS</span>
          <h1>Um lugar para cada gasto do grupo.</h1>
          <p>Crie um rolê, convide pessoas e deixe o cálculo por nossa conta.</p>
          <ul className="feature-checks">
            <li><span>✓</span> Divisão igual entre participantes</li>
            <li><span>✓</span> Saldos atualizados automaticamente</li>
            <li><span>✓</span> Confirmação de acertos simulados</li>
          </ul>
        </div>
      </section>
      <section className="auth-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="mobile-logo"><Logo /></span>
          <div className="auth-form__heading">
            <span className="eyebrow">NOVA CONTA</span>
            <h2>Crie seu acesso</h2>
            <p>Contas novas são cadastradas como usuário comum.</p>
          </div>
          <Feedback>{error}</Feedback>
          <label className="field">
            <span>Nome completo</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" required />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Pelo menos 6 caracteres" required />
          </label>
          <button className="button button--primary button--full" disabled={submitting}>{submitting ? 'Criando...' : 'Criar conta'}</button>
          <p className="auth-switch">Já tem uma conta? <Link to="/login">Entrar</Link></p>
        </form>
      </section>
    </main>
  );
}
