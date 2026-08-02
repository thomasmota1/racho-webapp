import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requisicaoApi } from '../services/api.js';
import { formatarDinheiro } from '../utils/format.js';
import Modal from '../components/Modal.jsx';
import { Carregamento, EstadoVazio, Feedback } from '../components/Feedback.jsx';

const opcoesEmoji = ['🎉', '🏖️', '🔥', '🏠', '🎓', '🎁', '🚗', '🍕'];

export default function PaginaPainel() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [exibirCriacao, setExibirCriacao] = useState(false);

  async function carregarPainel() {
    try {
      setDados(await requisicaoApi('/groups/dashboard'));
    } catch (falha) {
      setErro(falha.message);
    }
  }

  useEffect(() => {
    carregarPainel();
  }, []);

  if (!dados && !erro) return <Carregamento texto="Carregando seus grupos..." />;

  return (
    <>
      <section className="dashboard-heading">
        <div>
          <h2>Resumo dos grupos</h2>
          <p>Consulte os saldos e pagamentos registrados.</p>
        </div>
        <button className="button button--primary" onClick={() => setExibirCriacao(true)}>
          ＋ Novo grupo
        </button>
      </section>

      <Feedback>{erro}</Feedback>

      <section className="stats-grid">
        <CartaoResumo
          rotulo="Você recebe"
          valor={formatarDinheiro(dados?.summary.receives)}
          observacao="Créditos nos grupos"
          estilo="positive"
        />
        <CartaoResumo
          rotulo="Você deve"
          valor={formatarDinheiro(dados?.summary.owes)}
          observacao="Valores a acertar"
          estilo="negative"
        />
        <CartaoResumo
          rotulo="Pendências"
          valor={dados?.summary.pendingSettlements || 0}
          observacao="Pagamentos aguardando confirmação"
          estilo="warning"
        />
        <CartaoResumo
          rotulo="Grupos"
          valor={dados?.summary.groupCount || 0}
          observacao={`${formatarDinheiro(dados?.summary.totalExpenses)} registrados`}
          estilo="neutral"
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SEUS ROLÊS</span>
            <h2>Grupos recentes</h2>
          </div>
          <button className="text-button" onClick={() => setExibirCriacao(true)}>Criar novo</button>
        </div>

        {dados?.groups.length === 0 ? (
          <EstadoVazio
            icone="🎈"
            titulo="Nenhum grupo por aqui"
            texto="Crie seu primeiro grupo para começar a dividir despesas."
            acao={(
              <button className="button button--primary" onClick={() => setExibirCriacao(true)}>
                Criar grupo
              </button>
            )}
          />
        ) : (
          <div className="group-grid">
            {dados?.groups.map((grupo) => <CartaoGrupo key={grupo.id} grupo={grupo} />)}
          </div>
        )}
      </section>

      {exibirCriacao && (
        <ModalCriarGrupo
          aoFechar={() => setExibirCriacao(false)}
          aoCriar={() => {
            setExibirCriacao(false);
            carregarPainel();
          }}
        />
      )}
    </>
  );
}

function CartaoResumo({ rotulo, valor, observacao, estilo }) {
  return (
    <article className={`stat-card stat-card--${estilo}`}>
      <span className="stat-card__dot" />
      <small>{rotulo}</small>
      <strong>{valor}</strong>
      <p>{observacao}</p>
    </article>
  );
}

function CartaoGrupo({ grupo }) {
  const estiloSaldo = grupo.ownBalance > 0
    ? 'positive'
    : grupo.ownBalance < 0
      ? 'negative'
      : 'neutral';

  let textoSaldo = 'Tudo acertado';
  if (grupo.ownBalance > 0) textoSaldo = `Você recebe ${formatarDinheiro(grupo.ownBalance)}`;
  if (grupo.ownBalance < 0) textoSaldo = `Você deve ${formatarDinheiro(Math.abs(grupo.ownBalance))}`;

  return (
    <Link className="group-card" to={`/groups/${grupo.id}`}>
      <div className="group-card__top">
        <span className="group-emoji">{grupo.coverEmoji}</span>
        <span className="group-card__arrow">↗</span>
      </div>
      <h3>{grupo.name}</h3>
      <p>{grupo.description || 'Sem descrição.'}</p>
      <div className="group-card__meta">
        <span>{grupo.memberCount} pessoas</span>
        <span>{grupo.expenseCount} despesas</span>
      </div>
      <footer>
        <span>Total: {formatarDinheiro(grupo.totalExpenses)}</span>
        <strong className={`money-${estiloSaldo}`}>{textoSaldo}</strong>
      </footer>
    </Link>
  );
}

function ModalCriarGrupo({ aoFechar, aoCriar }) {
  const [formulario, setFormulario] = useState({ nome: '', descricao: '', emoji: '🎉' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      await requisicaoApi('/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: formulario.nome,
          description: formulario.descricao,
          coverEmoji: formulario.emoji,
        }),
      });
      aoCriar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Novo grupo" subtitulo="Crie um espaço para reunir as despesas." aoFechar={aoFechar}>
      <form className="form-stack" onSubmit={enviarFormulario}>
        <Feedback>{erro}</Feedback>
        <div className="emoji-picker">
          {opcoesEmoji.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className={formulario.emoji === emoji ? 'selected' : ''}
              onClick={() => setFormulario({ ...formulario, emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Nome do grupo</span>
          <input
            value={formulario.nome}
            onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
            placeholder="Ex.: Viagem para Caldas"
            required
          />
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea
            value={formulario.descricao}
            onChange={(evento) => setFormulario({ ...formulario, descricao: evento.target.value })}
            placeholder="O que será organizado neste grupo?"
            rows="3"
          />
        </label>
        <div className="form-actions">
          <button type="button" className="button button--ghost" onClick={aoFechar}>Cancelar</button>
          <button className="button button--primary" disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar grupo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
