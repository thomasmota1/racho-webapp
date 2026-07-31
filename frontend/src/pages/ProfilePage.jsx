import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import Avatar from '../components/Avatar.jsx';
import { Feedback } from '../components/Feedback.jsx';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      await api('/auth/me', { method: 'PATCH', body: JSON.stringify(form) });
      await refreshUser();
      setForm((current) => ({ ...current, currentPassword: '', newPassword: '' }));
      setMessage('Perfil atualizado com sucesso.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <div className="profile-layout">
      <aside className="profile-card">
        <Avatar name={user.name} size="xl" />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <span className="role-badge">{user.role === 'ADMIN' ? 'Administrador do site' : 'Usuário comum'}</span>
      </aside>
      <section className="content-card">
        <div className="section-heading"><div><span className="eyebrow">DADOS DA CONTA</span><h2>Editar perfil</h2></div></div>
        <form className="form-stack" onSubmit={submit}>
          <Feedback>{error}</Feedback>
          <Feedback type="success">{message}</Feedback>
          <div className="form-grid">
            <label className="field"><span>Nome</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label className="field"><span>E-mail</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          </div>
          <div className="divider" />
          <h3>Alterar senha</h3>
          <p className="muted">Deixe os campos vazios para manter a senha atual.</p>
          <div className="form-grid">
            <label className="field"><span>Senha atual</span><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label>
            <label className="field"><span>Nova senha</span><input type="password" minLength="6" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label>
          </div>
          <div className="form-actions"><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>
        </form>
      </section>
    </div>
  );
}
