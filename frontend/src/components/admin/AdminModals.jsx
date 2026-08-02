import { useState } from 'react';
import { requisicaoApi } from '../../services/api.js';
import { Feedback } from '../Feedback.jsx';
import Modal from '../Modal.jsx';

export function ModalUsuario({ usuario, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    nome: usuario.name,
    perfil: usuario.role,
    ativo: usuario.active,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await requisicaoApi(`/admin/users/${usuario.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formulario.nome,
          role: formulario.perfil,
          active: formulario.ativo,
        }),
      });
      aoSalvar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Editar usuário"
      subtitulo="Altere o nome, o perfil ou o acesso à plataforma."
      aoFechar={aoFechar}
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <label className="field">
          <span>Nome</span>
          <input
            value={formulario.nome}
            onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
            required
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Perfil</span>
            <select
              value={formulario.perfil}
              onChange={(evento) => setFormulario({ ...formulario, perfil: evento.target.value })}
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={String(formulario.ativo)}
              onChange={(evento) => setFormulario({
                ...formulario,
                ativo: evento.target.value === 'true',
              })}
            >
              <option value="true">Ativo</option>
              <option value="false">Desativado</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar usuário'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalCategoria({ categoria, aoFechar, aoSalvar }) {
  const editando = Boolean(categoria);
  const [formulario, setFormulario] = useState({
    nome: categoria?.name || '',
    icone: categoria?.icon || '🧾',
    cor: categoria?.color || '#6558d3',
    ativa: categoria?.active ?? true,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      const caminho = editando ? `/categories/${categoria.id}` : '/categories';
      await requisicaoApi(caminho, {
        method: editando ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: formulario.nome,
          icon: formulario.icone,
          color: formulario.cor,
          active: formulario.ativa,
        }),
      });
      aoSalvar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? 'Editar categoria' : 'Nova categoria'}
      subtitulo="As categorias ficam disponíveis para todos os grupos."
      aoFechar={aoFechar}
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <div className="form-grid">
          <label className="field">
            <span>Ícone</span>
            <input
              value={formulario.icone}
              onChange={(evento) => setFormulario({ ...formulario, icone: evento.target.value })}
            />
          </label>
          <label className="field">
            <span>Cor</span>
            <input
              type="color"
              value={formulario.cor}
              onChange={(evento) => setFormulario({ ...formulario, cor: evento.target.value })}
            />
          </label>
          <label className="field field--span-2">
            <span>Nome</span>
            <input
              value={formulario.nome}
              onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
              required
            />
          </label>
          {editando && (
            <label className="field field--span-2">
              <span>Status</span>
              <select
                value={String(formulario.ativa)}
                onChange={(evento) => setFormulario({
                  ...formulario,
                  ativa: evento.target.value === 'true',
                })}
              >
                <option value="true">Ativa</option>
                <option value="false">Desativada</option>
              </select>
            </label>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar categoria'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
