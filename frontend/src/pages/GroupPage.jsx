import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { requisicaoApi } from '../services/api.js';
import { formatarDinheiro } from '../utils/format.js';
import { usarAutenticacao } from '../contexts/AuthContext.jsx';
import DialogoConfirmacao from '../components/ConfirmDialog.jsx';
import { Carregamento, Feedback } from '../components/Feedback.jsx';
import {
  ListaAcertos,
  ListaDespesas,
  ListaMembros,
  PainelSaldos,
  ResumoSaldoGrupo,
} from '../components/group/GroupSections.jsx';
import {
  ModalAdicionarPessoa,
  ModalDespesa,
  ModalEditarGrupo,
  ModalPagamento,
} from '../components/group/GroupModals.jsx';

const ABAS = [
  { id: 'despesas', rotulo: 'Despesas' },
  { id: 'saldos', rotulo: 'Saldos' },
  { id: 'acertos', rotulo: 'Acertos' },
  { id: 'pessoas', rotulo: 'Pessoas' },
];

export default function PaginaGrupo() {
  const { id: grupoId } = useParams();
  const navegar = useNavigate();
  const { usuario } = usarAutenticacao();
  const [grupo, setGrupo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [abaSelecionada, setAbaSelecionada] = useState('despesas');
  const [modalAberto, setModalAberto] = useState(null);
  const [erro, setErro] = useState('');

  async function carregarGrupo() {
    try {
      const [dadosGrupo, dadosCategorias] = await Promise.all([
        requisicaoApi(`/groups/${grupoId}`),
        requisicaoApi('/categories'),
      ]);

      setGrupo(dadosGrupo);
      setCategorias(dadosCategorias);
      setErro('');
    } catch (falha) {
      setErro(falha.message);
    }
  }

  useEffect(() => {
    carregarGrupo();
  }, [grupoId]);

  const podeGerenciarGrupo = grupo
    && (usuario.role === 'ADMIN' || grupo.createdBy.id === usuario.id);

  async function excluirGrupo() {
    await requisicaoApi(`/groups/${grupo.id}`, { method: 'DELETE' });
    navegar('/');
  }

  function fecharModalERecarregar() {
    setModalAberto(null);
    carregarGrupo();
  }

  function pedirExclusaoDaDespesa(despesa) {
    setModalAberto({
      tipo: 'confirmacao',
      titulo: 'Excluir despesa?',
      mensagem: `A despesa "${despesa.title}" será removida e os saldos serão recalculados.`,
      textoConfirmacao: 'Excluir despesa',
      acao: async () => {
        await requisicaoApi(`/expenses/${despesa.id}`, { method: 'DELETE' });
        carregarGrupo();
      },
    });
  }

  function pedirRemocaoDaPessoa(membro) {
    setModalAberto({
      tipo: 'confirmacao',
      titulo: 'Remover pessoa?',
      mensagem: `${membro.user.name} deixará de participar deste grupo.`,
      textoConfirmacao: 'Remover pessoa',
      acao: async () => {
        await requisicaoApi(`/groups/${grupo.id}/members/${membro.user.id}`, { method: 'DELETE' });
        carregarGrupo();
      },
    });
  }

  if (!grupo && !erro) return <Carregamento texto="Abrindo o grupo..." />;
  if (!grupo) return <Feedback>{erro}</Feedback>;

  return (
    <>
      <Feedback>{erro}</Feedback>

      <CabecalhoGrupo
        grupo={grupo}
        podeGerenciar={podeGerenciarGrupo}
        aoEditar={() => setModalAberto({ tipo: 'grupo' })}
        aoExcluir={() => setModalAberto({
          tipo: 'confirmacao',
          titulo: 'Excluir grupo?',
          mensagem: 'Essa ação remove o grupo, suas despesas e seus acertos. Não será possível desfazer.',
          textoConfirmacao: 'Excluir grupo',
          acao: excluirGrupo,
        })}
        aoAdicionarDespesa={() => setModalAberto({ tipo: 'despesa' })}
      />

      <ResumoNumericoGrupo grupo={grupo} />

      <ResumoSaldoGrupo
        grupo={grupo}
        usuario={usuario}
        aoAdicionarDespesa={() => setModalAberto({ tipo: 'despesa' })}
      />

      <NavegacaoAbas
        abaSelecionada={abaSelecionada}
        aoSelecionar={setAbaSelecionada}
      />

      <section className="content-card group-content">
        {abaSelecionada === 'despesas' && (
          <ListaDespesas
            grupo={grupo}
            usuario={usuario}
            aoEditar={(despesa) => setModalAberto({ tipo: 'despesa', dados: despesa })}
            aoExcluir={pedirExclusaoDaDespesa}
          />
        )}
        {abaSelecionada === 'saldos' && (
          <PainelSaldos
            grupo={grupo}
            usuario={usuario}
            aoInformarPagamento={(sugestao) => setModalAberto({ tipo: 'pagamento', dados: sugestao })}
          />
        )}
        {abaSelecionada === 'acertos' && (
          <ListaAcertos grupo={grupo} usuario={usuario} aoAtualizar={carregarGrupo} />
        )}
        {abaSelecionada === 'pessoas' && (
          <ListaMembros
            grupo={grupo}
            podeGerenciar={podeGerenciarGrupo}
            aoAdicionar={() => setModalAberto({ tipo: 'pessoa' })}
            aoExcluir={pedirRemocaoDaPessoa}
          />
        )}
      </section>

      <ModaisDaPagina
        modalAberto={modalAberto}
        grupo={grupo}
        categorias={categorias}
        usuario={usuario}
        aoFechar={() => setModalAberto(null)}
        aoSalvar={fecharModalERecarregar}
        aoSalvarPagamento={() => {
          fecharModalERecarregar();
          setAbaSelecionada('acertos');
        }}
      />
    </>
  );
}

function CabecalhoGrupo({ grupo, podeGerenciar, aoEditar, aoExcluir, aoAdicionarDespesa }) {
  return (
    <section className="group-header">
      <div className="group-header__identity">
        <span className="group-header__emoji">{grupo.coverEmoji}</span>
        <div>
          <span className="eyebrow">CRIADO POR {grupo.createdBy.name.toUpperCase()}</span>
          <h2>{grupo.name}</h2>
          <p>{grupo.description || 'Grupo sem descrição.'}</p>
        </div>
      </div>

      <div className="group-header__actions">
        {podeGerenciar && (
          <button className="button button--ghost" onClick={aoEditar}>Editar grupo</button>
        )}
        {podeGerenciar && (
          <button className="button button--danger-light" onClick={aoExcluir}>Excluir</button>
        )}
        <button className="button button--primary" onClick={aoAdicionarDespesa}>
          Adicionar despesa
        </button>
      </div>
    </section>
  );
}

function ResumoNumericoGrupo({ grupo }) {
  const acertosConfirmados = grupo.settlements.filter(
    (acerto) => acerto.status === 'CONFIRMED',
  ).length;

  return (
    <section className="mini-stats">
      <div>
        <span>Total registrado</span>
        <strong>{formatarDinheiro(grupo.totalExpenses)}</strong>
      </div>
      <div>
        <span>Participantes</span>
        <strong>{grupo.members.length}</strong>
      </div>
      <div>
        <span>Despesas</span>
        <strong>{grupo.expenses.length}</strong>
      </div>
      <div>
        <span>Acertos confirmados</span>
        <strong>{acertosConfirmados}</strong>
      </div>
    </section>
  );
}

function NavegacaoAbas({ abaSelecionada, aoSelecionar }) {
  return (
    <nav className="tabs">
      {ABAS.map((aba) => (
        <button
          key={aba.id}
          className={abaSelecionada === aba.id ? 'active' : ''}
          onClick={() => aoSelecionar(aba.id)}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
  );
}

function ModaisDaPagina({
  modalAberto,
  grupo,
  categorias,
  usuario,
  aoFechar,
  aoSalvar,
  aoSalvarPagamento,
}) {
  if (modalAberto?.tipo === 'despesa') {
    return (
      <ModalDespesa
        grupo={grupo}
        categorias={categorias}
        despesa={modalAberto.dados}
        aoFechar={aoFechar}
        aoSalvar={aoSalvar}
      />
    );
  }
  if (modalAberto?.tipo === 'pagamento') {
    return (
      <ModalPagamento
        grupo={grupo}
        usuario={usuario}
        sugestao={modalAberto.dados}
        aoFechar={aoFechar}
        aoSalvar={aoSalvarPagamento}
      />
    );
  }
  if (modalAberto?.tipo === 'pessoa') {
    return <ModalAdicionarPessoa grupo={grupo} aoFechar={aoFechar} aoSalvar={aoSalvar} />;
  }
  if (modalAberto?.tipo === 'grupo') {
    return <ModalEditarGrupo grupo={grupo} aoFechar={aoFechar} aoSalvar={aoSalvar} />;
  }
  if (modalAberto?.tipo === 'confirmacao') {
    return (
      <DialogoConfirmacao
        titulo={modalAberto.titulo}
        mensagem={modalAberto.mensagem}
        textoConfirmacao={modalAberto.textoConfirmacao}
        aoConfirmar={modalAberto.acao}
        aoFechar={aoFechar}
      />
    );
  }
  return null;
}
