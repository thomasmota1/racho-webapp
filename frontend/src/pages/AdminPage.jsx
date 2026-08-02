// Importa recursos administrativos.
import { useEffect, useState } from 'react';
import { requisicaoApi } from '../services/api.js';
import DialogoConfirmacao from '../components/ConfirmDialog.jsx';
import { Carregamento, Feedback } from '../components/Feedback.jsx';
import {
  ResumoAdministracao,
  TabelaCategorias,
  TabelaGrupos,
  TabelaUsuarios,
} from '../components/admin/AdminSections.jsx';
import { ModalCategoria, ModalUsuario } from '../components/admin/AdminModals.jsx';

// Define as abas administrativas.
const ABAS_ADMINISTRACAO = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'usuarios', rotulo: 'Usuários' },
  { id: 'grupos', rotulo: 'Grupos' },
  { id: 'categorias', rotulo: 'Categorias' },
];

// Exibe o painel administrativo.
export default function PaginaAdministracao() {
  // Controla dados, abas e modais.
  const [abaSelecionada, setAbaSelecionada] = useState('resumo');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);

  // Busca todos os dados administrativos.
  async function carregarDados() {
    try {
      // Carrega recursos em paralelo.
      const [resumo, usuarios, grupos, categorias] = await Promise.all([
        requisicaoApi('/admin/overview'),
        requisicaoApi('/admin/users'),
        requisicaoApi('/admin/groups'),
        requisicaoApi('/categories'),
      ]);

      setDados({ resumo, usuarios, grupos, categorias });
      setErro('');
    } catch (falha) {
      setErro(falha.message);
    }
  }

  // Carrega dados ao abrir.
  useEffect(() => {
    carregarDados();
  }, []);

  // Exclui o recurso selecionado.
  async function excluirRecurso(caminho) {
    try {
      await requisicaoApi(caminho, { method: 'DELETE' });
      carregarDados();
    } catch (falha) {
      setErro(falha.message);
    }
  }

  // Fecha modal e recarrega.
  function fecharModalERecarregar() {
    setModalAberto(null);
    carregarDados();
  }

  // Trata o carregamento inicial.
  if (!dados && !erro) {
    return <Carregamento texto="Carregando o painel administrativo..." />;
  }
  if (!dados) return <Feedback>{erro}</Feedback>;

  return (
    <>
      {/* Identifica a área administrativa. */}
      <section className="admin-banner">
        <div>
          <span>◇</span>
          <div>
            <strong>Painel administrativo</strong>
            <p>Gerencie usuários, grupos e categorias.</p>
          </div>
        </div>
        <small>Use as ações de exclusão com atenção.</small>
      </section>

      <Feedback>{erro}</Feedback>

      {/* Permite navegar entre cadastros. */}
      <nav className="tabs tabs--admin">
        {ABAS_ADMINISTRACAO.map((aba) => (
          <button
            key={aba.id}
            className={abaSelecionada === aba.id ? 'active' : ''}
            onClick={() => setAbaSelecionada(aba.id)}
          >
            {aba.rotulo}
          </button>
        ))}
      </nav>

      {/* Exibe o conteúdo selecionado. */}
      {abaSelecionada === 'resumo' && <ResumoAdministracao resumo={dados.resumo} />}
      {abaSelecionada === 'usuarios' && (
        <TabelaUsuarios
          usuarios={dados.usuarios}
          aoEditar={(usuario) => setModalAberto({ tipo: 'usuario', dados: usuario })}
        />
      )}
      {abaSelecionada === 'grupos' && (
        <TabelaGrupos
          grupos={dados.grupos}
          aoExcluir={(grupo) => setConfirmacao({
            titulo: 'Excluir grupo?',
            mensagem: `O grupo "${grupo.name}" e suas despesas serão removidos.`,
            caminho: `/groups/${grupo.id}`,
            textoConfirmacao: 'Excluir grupo',
          })}
        />
      )}
      {abaSelecionada === 'categorias' && (
        <TabelaCategorias
          categorias={dados.categorias}
          aoCriar={() => setModalAberto({ tipo: 'categoria' })}
          aoEditar={(categoria) => setModalAberto({ tipo: 'categoria', dados: categoria })}
          aoExcluir={(categoria) => setConfirmacao({
            titulo: 'Excluir categoria?',
            mensagem: `A categoria "${categoria.name}" será removida.`,
            caminho: `/categories/${categoria.id}`,
            textoConfirmacao: 'Excluir categoria',
          })}
        />
      )}

      {/* Exibe formulários administrativos. */}
      {modalAberto?.tipo === 'usuario' && (
        <ModalUsuario
          usuario={modalAberto.dados}
          aoFechar={() => setModalAberto(null)}
          aoSalvar={fecharModalERecarregar}
        />
      )}
      {modalAberto?.tipo === 'categoria' && (
        <ModalCategoria
          categoria={modalAberto.dados}
          aoFechar={() => setModalAberto(null)}
          aoSalvar={fecharModalERecarregar}
        />
      )}
      {/* Confirma exclusões administrativas. */}
      {confirmacao && (
        <DialogoConfirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          textoConfirmacao={confirmacao.textoConfirmacao}
          aoConfirmar={() => excluirRecurso(confirmacao.caminho)}
          aoFechar={() => setConfirmacao(null)}
        />
      )}
    </>
  );
}
