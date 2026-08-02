import { useState } from 'react';
import { requisicaoApi } from '../../services/api.js';
import { dataParaInput, formatarDinheiro } from '../../utils/format.js';
import Avatar from '../Avatar.jsx';
import { Feedback } from '../Feedback.jsx';
import Modal from '../Modal.jsx';

export function ModalDespesa({ grupo, categorias, despesa, aoFechar, aoSalvar }) {
  const editando = Boolean(despesa);
  const participantesIniciais = despesa
    ? despesa.shares.map((parte) => parte.user.id)
    : grupo.members.map((membro) => membro.user.id);

  const [formulario, setFormulario] = useState({
    titulo: despesa?.title || '',
    descricao: despesa?.description || '',
    valor: despesa ? Number(despesa.amount) : '',
    data: dataParaInput(despesa?.date),
    pagadorId: despesa?.payer.id || grupo.members[0]?.user.id,
    categoriaId: despesa?.category.id || categorias[0]?.id,
    participantesIds: participantesIniciais,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function alternarParticipante(usuarioId) {
    setFormulario((formularioAtual) => ({
      ...formularioAtual,
      participantesIds: formularioAtual.participantesIds.includes(usuarioId)
        ? formularioAtual.participantesIds.filter((id) => id !== usuarioId)
        : [...formularioAtual.participantesIds, usuarioId],
    }));
  }

  const valorPorPessoa = formulario.participantesIds.length && formulario.valor
    ? Number(formulario.valor) / formulario.participantesIds.length
    : 0;

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      const caminho = editando
        ? `/expenses/${despesa.id}`
        : `/groups/${grupo.id}/expenses`;
      await requisicaoApi(caminho, {
        method: editando ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title: formulario.titulo,
          description: formulario.descricao,
          amount: formulario.valor,
          date: formulario.data,
          payerId: formulario.pagadorId,
          categoryId: formulario.categoriaId,
          participantIds: formulario.participantesIds,
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
      titulo={editando ? 'Editar despesa' : 'Nova despesa'}
      subtitulo="A divisão é feita igualmente entre as pessoas selecionadas."
      aoFechar={aoFechar}
      amplo
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <div className="form-grid">
          <label className="field field--span-2">
            <span>Título</span>
            <input
              value={formulario.titulo}
              onChange={(evento) => setFormulario({ ...formulario, titulo: evento.target.value })}
              placeholder="Ex.: Compras do mercado"
              required
            />
          </label>
          <label className="field">
            <span>Valor total</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formulario.valor}
              onChange={(evento) => setFormulario({ ...formulario, valor: evento.target.value })}
              placeholder="0,00"
              required
            />
          </label>
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={formulario.data}
              onChange={(evento) => setFormulario({ ...formulario, data: evento.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Quem pagou?</span>
            <select
              value={formulario.pagadorId}
              onChange={(evento) => setFormulario({
                ...formulario,
                pagadorId: Number(evento.target.value),
              })}
            >
              {grupo.members.map((membro) => (
                <option key={membro.user.id} value={membro.user.id}>{membro.user.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Categoria</span>
            <select
              value={formulario.categoriaId}
              onChange={(evento) => setFormulario({
                ...formulario,
                categoriaId: Number(evento.target.value),
              })}
            >
              {categorias
                .filter((categoria) => categoria.active || categoria.id === despesa?.category.id)
                .map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.icon} {categoria.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field field--span-2">
            <span>Observação</span>
            <textarea
              rows="2"
              value={formulario.descricao}
              onChange={(evento) => setFormulario({ ...formulario, descricao: evento.target.value })}
              placeholder="Detalhes opcionais"
            />
          </label>
        </div>

        <div className="participant-box">
          <div>
            <strong>Quem participa desta despesa?</strong>
            <span>
              {formulario.participantesIds.length} selecionados ·{' '}
              {formatarDinheiro(valorPorPessoa)} para cada
            </span>
          </div>
          <div className="participant-options">
            {grupo.members.map((membro) => (
              <label
                key={membro.user.id}
                className={formulario.participantesIds.includes(membro.user.id) ? 'selected' : ''}
              >
                <input
                  type="checkbox"
                  checked={formulario.participantesIds.includes(membro.user.id)}
                  onChange={() => alternarParticipante(membro.user.id)}
                />
                <Avatar nome={membro.user.name} tamanho="sm" />
                <span>{membro.user.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar despesa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalPagamento({ grupo, usuario, sugestao, aoFechar, aoSalvar }) {
  const outroMembroId = grupo.members.find((membro) => membro.user.id !== usuario.id)?.user.id;
  const [formulario, setFormulario] = useState({
    pagadorId: sugestao?.payer.id || usuario.id,
    recebedorId: sugestao?.receiver.id || outroMembroId,
    valor: sugestao?.amount || '',
    forma: 'PIX',
    observacao: '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const nomePagador = grupo.members.find(
    (membro) => membro.user.id === Number(formulario.pagadorId),
  )?.user.name || '';
  const nomeRecebedor = grupo.members.find(
    (membro) => membro.user.id === Number(formulario.recebedorId),
  )?.user.name || '';

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await requisicaoApi(`/groups/${grupo.id}/settlements`, {
        method: 'POST',
        body: JSON.stringify({
          payerId: formulario.pagadorId,
          receiverId: formulario.recebedorId,
          amount: formulario.valor,
          method: formulario.forma,
          note: formulario.observacao,
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
      titulo="Informar pagamento"
      subtitulo="Registre um valor que foi pago entre os participantes."
      aoFechar={aoFechar}
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <div className="payment-notice">
          <span>!</span>
          <p>A pessoa que recebeu deverá confirmar o pagamento registrado.</p>
        </div>
        <label className="field">
          <span>Quem pagou?</span>
          <input value={nomePagador} readOnly />
        </label>
        <label className="field">
          <span>Quem recebeu?</span>
          <input value={nomeRecebedor} readOnly />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Valor</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={formulario.valor}
              onChange={(evento) => setFormulario({ ...formulario, valor: evento.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Forma usada</span>
            <select
              value={formulario.forma}
              onChange={(evento) => setFormulario({ ...formulario, forma: evento.target.value })}
            >
              <option>PIX</option>
              <option>DINHEIRO</option>
              <option>TRANSFERÊNCIA</option>
              <option>OUTRO</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Observação</span>
          <input
            value={formulario.observacao}
            onChange={(evento) => setFormulario({ ...formulario, observacao: evento.target.value })}
            placeholder="Opcional"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Registrar pagamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalAdicionarPessoa({ grupo, aoFechar, aoSalvar }) {
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await requisicaoApi(`/groups/${grupo.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
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
      titulo="Adicionar pessoa"
      subtitulo="A pessoa precisa ter uma conta cadastrada no Rachô."
      aoFechar={aoFechar}
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <label className="field">
          <span>E-mail da pessoa</span>
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="pessoa@email.com"
            required
          />
        </label>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Adicionando...' : 'Adicionar ao grupo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ModalEditarGrupo({ grupo, aoFechar, aoSalvar }) {
  const [formulario, setFormulario] = useState({
    nome: grupo.name,
    descricao: grupo.description || '',
    emoji: grupo.coverEmoji,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await requisicaoApi(`/groups/${grupo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formulario.nome,
          description: formulario.descricao,
          coverEmoji: formulario.emoji,
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
      titulo="Editar grupo"
      subtitulo="Altere o nome, a descrição ou o emoji do grupo."
      aoFechar={aoFechar}
    >
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <div className="form-grid">
          <label className="field">
            <span>Emoji</span>
            <input
              value={formulario.emoji}
              maxLength="4"
              onChange={(evento) => setFormulario({ ...formulario, emoji: evento.target.value })}
            />
          </label>
          <label className="field">
            <span>Nome</span>
            <input
              value={formulario.nome}
              onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
              required
            />
          </label>
          <label className="field field--span-2">
            <span>Descrição</span>
            <textarea
              rows="3"
              value={formulario.descricao}
              onChange={(evento) => setFormulario({ ...formulario, descricao: evento.target.value })}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
