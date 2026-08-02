// Importa dados e elementos visuais.
import { useState } from 'react';
import { requisicaoApi } from '../../services/api.js';
import { formatarDataCurta, formatarDinheiro } from '../../utils/format.js';
import Avatar from '../Avatar.jsx';
import IndicadorStatus from '../StatusBadge.jsx';
import { EstadoVazio, Feedback } from '../Feedback.jsx';

// Converte saldo em mensagem.
function textoDoSaldo(saldo) {
  if (saldo > 0) return `Você recebe ${formatarDinheiro(saldo)}`;
  if (saldo < 0) return `Você paga ${formatarDinheiro(Math.abs(saldo))}`;
  return 'Você está em dia';
}

// Resume o saldo do usuário.
export function ResumoSaldoGrupo({ grupo, usuario, aoAdicionarDespesa }) {
  // Localiza e classifica o saldo.
  const saldo = grupo.balances.find((item) => item.user.id === usuario.id)?.balance || 0;
  const estilo = saldo > 0 ? 'positive' : saldo < 0 ? 'negative' : 'neutral';

  return (
    <section className={`group-balance-card group-balance-card--${estilo}`}>
      <div>
        <span className="eyebrow">SEU SALDO NESTE GRUPO</span>
        <h2>{textoDoSaldo(saldo)}.</h2>
        <p>Consulte as sugestões de pagamento na aba Saldos.</p>
      </div>
      <button className="button button--primary" onClick={aoAdicionarDespesa}>
        Adicionar despesa
      </button>
    </section>
  );
}

// Lista despesas cadastradas.
export function ListaDespesas({ grupo, usuario, aoEditar, aoExcluir }) {
  // Trata grupos sem despesas.
  if (grupo.expenses.length === 0) {
    return (
      <EstadoVazio
        icone="🧾"
        titulo="Nenhuma despesa cadastrada"
        texto="Adicione uma despesa para iniciar o cálculo dos saldos."
      />
    );
  }

  return (
    <div>
      {/* Exibe cabeçalho da lista. */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">HISTÓRICO</span>
          <h2>Despesas do grupo</h2>
        </div>
        <span className="count-badge">{grupo.expenses.length} registros</span>
      </div>

      {/* Monta cada despesa cadastrada. */}
      <div className="expense-list">
        {grupo.expenses.map((despesa) => {
          // Verifica permissão de edição.
          const podeEditar = usuario.role === 'ADMIN' || despesa.createdBy.id === usuario.id;

          return (
            <article className="expense-row" key={despesa.id}>
              <span
                className="category-icon"
                style={{
                  backgroundColor: `${despesa.category.color}18`,
                  color: despesa.category.color,
                }}
              >
                {despesa.category.icon}
              </span>
              <div className="expense-row__main">
                <strong>{despesa.title}</strong>
                <p>{despesa.payer.name} pagou · {formatarDataCurta(despesa.date)}</p>
                <small>
                  Dividido entre {despesa.shares.length}{' '}
                  {despesa.shares.length === 1 ? 'pessoa' : 'pessoas'}
                </small>
              </div>
              <div className="expense-row__amount">
                <strong>{formatarDinheiro(despesa.amount)}</strong>
                <span>{despesa.category.name}</span>
              </div>
              {podeEditar && (
                <div className="row-actions">
                  <button onClick={() => aoEditar(despesa)}>Editar</button>
                  <button className="danger-link" onClick={() => aoExcluir(despesa)}>Excluir</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

// Exibe saldos e sugestões.
export function PainelSaldos({ grupo, usuario, aoInformarPagamento }) {
  // Localiza o saldo pessoal.
  const saldoUsuario = grupo.balances.find((item) => item.user.id === usuario.id)?.balance || 0;

  return (
    <div>
      {/* Destaca o resultado pessoal. */}
      <div className="balance-highlight">
        <div>
          <span className="eyebrow">SEU RESULTADO NESTE GRUPO</span>
          <h2>{textoDoSaldo(saldoUsuario)}.</h2>
          <p>O saldo considera as despesas e os acertos confirmados.</p>
        </div>
        <span className="balance-highlight__symbol">↔</span>
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">POR PESSOA</span>
          <h2>Resumo dos participantes</h2>
        </div>
      </div>
      {/* Lista saldos dos participantes. */}
      <div className="balance-grid">
        {grupo.balances.map((item) => (
          <CartaoSaldo key={item.user.id} dadosSaldo={item} />
        ))}
      </div>

      {/* Lista sugestões de pagamento. */}
      <div className="section-heading section-heading--spaced">
        <div>
          <span className="eyebrow">MODO SEM CLIMÃO</span>
          <h2>Sugestões de pagamento</h2>
        </div>
      </div>
      {grupo.suggestions.length === 0 ? (
        <EstadoVazio
          icone="✓"
          titulo="Nenhum pagamento necessário"
          texto="Os saldos atuais do grupo estão zerados."
        />
      ) : (
        <div className="suggestion-list">
          {grupo.suggestions.map((sugestao, indice) => (
            <SugestaoPagamento
              key={`${sugestao.payer.id}-${sugestao.receiver.id}-${indice}`}
              sugestao={sugestao}
              podePagar={usuario.role === 'ADMIN' || sugestao.payer.id === usuario.id}
              aoInformar={() => aoInformarPagamento(sugestao)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Exibe o saldo individual.
function CartaoSaldo({ dadosSaldo }) {
  // Escolhe a cor adequada.
  const classeSaldo = dadosSaldo.balance > 0
    ? 'money-positive'
    : dadosSaldo.balance < 0
      ? 'money-negative'
      : 'money-neutral';

  return (
    <article className="balance-card">
      <Avatar nome={dadosSaldo.user.name} />
      <div>
        <strong>{dadosSaldo.user.name}</strong>
        <small>
          Pagou {formatarDinheiro(dadosSaldo.paid)} · Parte {formatarDinheiro(dadosSaldo.owed)}
        </small>
      </div>
      <span className={classeSaldo}>{textoDoSaldo(dadosSaldo.balance).replace('Você ', '')}</span>
    </article>
  );
}

// Exibe uma sugestão de pagamento.
function SugestaoPagamento({ sugestao, podePagar, aoInformar }) {
  return (
    <article className="suggestion">
      <div className="suggestion__people">
        <Avatar nome={sugestao.payer.name} />
        <span>→</span>
        <Avatar nome={sugestao.receiver.name} />
      </div>
      <div>
        <strong>
          {sugestao.payer.name} paga {formatarDinheiro(sugestao.amount)} para{' '}
          {sugestao.receiver.name}
        </strong>
        <p>Sugestão calculada a partir dos saldos atuais.</p>
      </div>
      {podePagar && (
        <button className="button button--small button--primary" onClick={aoInformar}>
          Informar pagamento
        </button>
      )}
    </article>
  );
}

// Lista pagamentos registrados.
export function ListaAcertos({ grupo, usuario, aoAtualizar }) {
  // Armazena falhas de atualização.
  const [erro, setErro] = useState('');

  // Atualiza o status do pagamento.
  async function atualizarStatus(acertoId, novoStatus) {
    try {
      await requisicaoApi(`/settlements/${acertoId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: novoStatus }),
      });
      aoAtualizar();
    } catch (falha) {
      setErro(falha.message);
    }
  }

  // Trata grupos sem pagamentos.
  if (grupo.settlements.length === 0) {
    return (
      <EstadoVazio
        icone="🤝"
        titulo="Nenhum acerto informado"
        texto="Os pagamentos registrados aparecerão aqui."
      />
    );
  }

  return (
    <div>
      <Feedback>{erro}</Feedback>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PAGAMENTOS REGISTRADOS</span>
          <h2>Histórico de acertos</h2>
        </div>
      </div>

      {/* Monta cada pagamento registrado. */}
      <div className="settlement-list">
        {grupo.settlements.map((acerto) => (
          <LinhaAcerto
            key={acerto.id}
            acerto={acerto}
            podeConfirmar={usuario.role === 'ADMIN' || acerto.receiver.id === usuario.id}
            aoAtualizarStatus={atualizarStatus}
          />
        ))}
      </div>
    </div>
  );
}

// Exibe uma linha de pagamento.
function LinhaAcerto({ acerto, podeConfirmar, aoAtualizarStatus }) {
  return (
    <article className="settlement-row">
      <div className="settlement-row__route">
        <Avatar nome={acerto.payer.name} />
        <span>→</span>
        <Avatar nome={acerto.receiver.name} />
      </div>
      <div className="settlement-row__main">
        <strong>{acerto.payer.name} → {acerto.receiver.name}</strong>
        <p>
          {acerto.method} · {formatarDataCurta(acerto.createdAt)}
          {acerto.note ? ` · ${acerto.note}` : ''}
        </p>
      </div>
      <strong>{formatarDinheiro(acerto.amount)}</strong>
      <IndicadorStatus
        status={acerto.status}
        rotulo={acerto.status === 'PENDING' ? 'Aguardando confirmação' : undefined}
      />
      <div className="row-actions">
        {podeConfirmar && acerto.status === 'PENDING' && (
          <>
            <button onClick={() => aoAtualizarStatus(acerto.id, 'CONFIRMED')}>Confirmar</button>
            <button
              className="danger-link"
              onClick={() => aoAtualizarStatus(acerto.id, 'REJECTED')}
            >
              Recusar
            </button>
          </>
        )}
      </div>
    </article>
  );
}

// Lista participantes do grupo.
export function ListaMembros({ grupo, podeGerenciar, aoAdicionar, aoExcluir }) {
  return (
    <div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PARTICIPANTES</span>
          <h2>Pessoas do grupo</h2>
        </div>
        {podeGerenciar && (
          <button className="button button--primary button--small" onClick={aoAdicionar}>
            ＋ Adicionar
          </button>
        )}
      </div>

      {/* Monta cada participante. */}
      <div className="member-grid">
        {grupo.members.map((membro) => (
          <article className="member-card" key={membro.id}>
            <Avatar nome={membro.user.name} tamanho="lg" />
            <div>
              <strong>{membro.user.name}</strong>
              <span>{membro.user.email}</span>
              {membro.user.id === grupo.createdBy.id && <small>Criador do grupo</small>}
            </div>
            {podeGerenciar && membro.user.id !== grupo.createdBy.id && (
              <button
                className="icon-button icon-button--danger"
                onClick={() => aoExcluir(membro)}
              >
                ×
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
