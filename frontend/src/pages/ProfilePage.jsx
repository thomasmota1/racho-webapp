import { useState } from 'react';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import { requisicaoApi } from '../services/api.js';
import Avatar from '../components/Avatar.jsx';
import { Feedback } from '../components/Feedback.jsx';

export default function PaginaPerfil() {
  const { usuario, atualizarUsuario } = usarAutenticacao();
  const [formulario, setFormulario] = useState({
    nome: usuario.name,
    email: usuario.email,
    senhaAtual: '',
    novaSenha: '',
  });
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    try {
      await requisicaoApi('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: formulario.nome,
          email: formulario.email,
          currentPassword: formulario.senhaAtual,
          newPassword: formulario.novaSenha,
        }),
      });
      await atualizarUsuario();
      setFormulario((formularioAtual) => ({
        ...formularioAtual,
        senhaAtual: '',
        novaSenha: '',
      }));
      setMensagem('Perfil atualizado com sucesso.');
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="profile-layout">
      <aside className="profile-card">
        <Avatar nome={usuario.name} tamanho="xl" />
        <h2>{usuario.name}</h2>
        <p>{usuario.email}</p>
        <span className="role-badge">
          {usuario.role === 'ADMIN' ? 'Administrador do site' : 'Usuário comum'}
        </span>
      </aside>
      <section className="content-card">
        <div className="section-heading"><div><span className="eyebrow">DADOS DA CONTA</span><h2>Editar perfil</h2></div></div>
        <form className="form-stack" onSubmit={enviarFormulario}>
          <Feedback>{erro}</Feedback>
          <Feedback tipo="success">{mensagem}</Feedback>
          <div className="form-grid">
            <label className="field">
              <span>Nome</span>
              <input
                value={formulario.nome}
                onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                type="email"
                value={formulario.email}
                onChange={(evento) => setFormulario({ ...formulario, email: evento.target.value })}
                required
              />
            </label>
          </div>
          <div className="divider" />
          <h3>Alterar senha</h3>
          <p className="muted">Deixe os campos vazios para manter a senha atual.</p>
          <div className="form-grid">
            <label className="field">
              <span>Senha atual</span>
              <input
                type="password"
                value={formulario.senhaAtual}
                onChange={(evento) => setFormulario({ ...formulario, senhaAtual: evento.target.value })}
              />
            </label>
            <label className="field">
              <span>Nova senha</span>
              <input
                type="password"
                minLength="6"
                value={formulario.novaSenha}
                onChange={(evento) => setFormulario({ ...formulario, novaSenha: evento.target.value })}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button button--primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
