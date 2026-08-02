import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { inputDate, money, shortDate } from '../utils/format.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';

const tabs = [
  ['expenses', 'Despesas'],
  ['balances', 'Saldos'],
  ['settlements', 'Acertos'],
  ['members', 'Pessoas'],
];

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('expenses');
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [groupData, categoryData] = await Promise.all([
        api(`/groups/${id}`),
        api('/categories'),
      ]);
      setGroup(groupData);
      setCategories(categoryData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  const canManageGroup = group && (user.role === 'ADMIN' || group.createdBy.id === user.id);

  async function removeGroup() {
    await api(`/groups/${group.id}`, { method: 'DELETE' });
    navigate('/');
  }

  if (!group && !error) return <Loading label="Abrindo o grupo..." />;
  if (!group) return <Feedback>{error}</Feedback>;

  return (
    <>
      <Feedback>{error}</Feedback>
      <section className="group-header">
        <div className="group-header__identity">
          <span className="group-header__emoji">{group.coverEmoji}</span>
          <div>
            <span className="eyebrow">CRIADO POR {group.createdBy.name.toUpperCase()}</span>
            <h2>{group.name}</h2>
            <p>{group.description || 'Grupo sem descrição.'}</p>
          </div>
        </div>
        <div className="group-header__actions">
          {canManageGroup && <button className="button button--ghost" onClick={() => setModal({ type: 'group' })}>Editar grupo</button>}
          {canManageGroup && <button className="button button--danger-light" onClick={() => setModal({ type: 'confirm', title: 'Excluir grupo?', message: 'Essa ação remove o grupo, suas despesas e seus acertos. Não será possível desfazer.', label: 'Excluir grupo', action: removeGroup })}>Excluir</button>}
          <button className="button button--primary" onClick={() => setModal({ type: 'expense' })}>Adicionar despesa</button>
        </div>
      </section>

      <section className="mini-stats">
        <div><span>Total registrado</span><strong>{money(group.totalExpenses)}</strong></div>
        <div><span>Participantes</span><strong>{group.members.length}</strong></div>
        <div><span>Despesas</span><strong>{group.expenses.length}</strong></div>
        <div><span>Acertos confirmados</span><strong>{group.settlements.filter((item) => item.status === 'CONFIRMED').length}</strong></div>
      </section>

      <GroupBalanceCard group={group} user={user} onExpense={() => setModal({ type: 'expense' })} />

      <nav className="tabs">
        {tabs.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
      </nav>

      <section className="content-card group-content">
        {tab === 'expenses' && <Expenses group={group} user={user} onEdit={(expense) => setModal({ type: 'expense', data: expense })} onDelete={(expense) => setModal({ type: 'confirm', title: 'Excluir despesa?', message: `A despesa "${expense.title}" será removida e os saldos serão recalculados.`, label: 'Excluir despesa', action: async () => { await api(`/expenses/${expense.id}`, { method: 'DELETE' }); load(); } })} />}
        {tab === 'balances' && <Balances group={group} user={user} onSettle={(suggestion) => setModal({ type: 'settlement', data: suggestion })} />}
        {tab === 'settlements' && <Settlements group={group} user={user} onReload={load} />}
        {tab === 'members' && <Members group={group} canManage={canManageGroup} onAdd={() => setModal({ type: 'member' })} onDelete={(member) => setModal({ type: 'confirm', title: 'Remover pessoa?', message: `${member.user.name} deixará de participar deste grupo.`, label: 'Remover pessoa', action: async () => { await api(`/groups/${group.id}/members/${member.user.id}`, { method: 'DELETE' }); load(); } })} />}
      </section>

      {modal?.type === 'expense' && <ExpenseModal group={group} categories={categories} expense={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'settlement' && <SettlementModal group={group} user={user} suggestion={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); setTab('settlements'); }} />}
      {modal?.type === 'member' && <MemberModal group={group} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'group' && <GroupEditModal group={group} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'confirm' && <ConfirmDialog title={modal.title} message={modal.message} confirmLabel={modal.label} onConfirm={modal.action} onClose={() => setModal(null)} />}
    </>
  );
}

function GroupBalanceCard({ group, user, onExpense }) {
  const own = group.balances.find((item) => item.user.id === user.id)?.balance || 0;
  const tone = own > 0 ? 'positive' : own < 0 ? 'negative' : 'neutral';
  const title = own > 0
    ? `Você tem ${money(own)} para receber neste grupo.`
    : own < 0
      ? `Você precisa pagar ${money(Math.abs(own))} neste grupo.`
      : 'Você está em dia neste grupo.';

  return (
    <section className={`group-balance-card group-balance-card--${tone}`}>
      <div><span className="eyebrow">SEU SALDO NESTE GRUPO</span><h2>{title}</h2><p>Veja os acertos recomendados na aba Saldos.</p></div>
      <button className="button button--primary" onClick={onExpense}>Adicionar despesa</button>
    </section>
  );
}

function Expenses({ group, user, onEdit, onDelete }) {
  if (group.expenses.length === 0) {
    return <EmptyState icon="🧾" title="Nenhuma despesa cadastrada" text="Use o botão “Despesa” para registrar o primeiro gasto." />;
  }

  return (
    <div>
      <div className="section-heading"><div><span className="eyebrow">HISTÓRICO</span><h2>Despesas do grupo</h2></div><span className="count-badge">{group.expenses.length} registros</span></div>
      <div className="expense-list">
        {group.expenses.map((expense) => {
          const canEdit = user.role === 'ADMIN' || expense.createdBy.id === user.id;
          return (
            <article className="expense-row" key={expense.id}>
              <span className="category-icon" style={{ backgroundColor: `${expense.category.color}18`, color: expense.category.color }}>{expense.category.icon}</span>
              <div className="expense-row__main">
                <strong>{expense.title}</strong>
                <p>{expense.payer.name} pagou · {shortDate(expense.date)}</p>
                <small>Dividido entre {expense.shares.length} {expense.shares.length === 1 ? 'pessoa' : 'pessoas'}</small>
              </div>
              <div className="expense-row__amount"><strong>{money(expense.amount)}</strong><span>{expense.category.name}</span></div>
              {canEdit && <div className="row-actions"><button onClick={() => onEdit(expense)}>Editar</button><button className="danger-link" onClick={() => onDelete(expense)}>Excluir</button></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Balances({ group, user, onSettle }) {
  const own = group.balances.find((item) => item.user.id === user.id);
  return (
    <div>
      <div className="balance-highlight">
        <div>
          <span className="eyebrow">SEU RESULTADO NESTE GRUPO</span>
          <h2>{!own || own.balance === 0 ? 'Você está em dia.' : own.balance > 0 ? `Você recebe ${money(own.balance)}` : `Você paga ${money(Math.abs(own.balance))}`}</h2>
          <p>O saldo considera despesas e acertos já confirmados.</p>
        </div>
        <span className="balance-highlight__symbol">↔</span>
      </div>

      <div className="section-heading"><div><span className="eyebrow">POR PESSOA</span><h2>Resumo dos participantes</h2></div></div>
      <div className="balance-grid">
        {group.balances.map((item) => (
          <article className="balance-card" key={item.user.id}>
            <Avatar name={item.user.name} />
            <div><strong>{item.user.name}</strong><small>Pagou {money(item.paid)} · Parte {money(item.owed)}</small></div>
            <span className={item.balance > 0 ? 'money-positive' : item.balance < 0 ? 'money-negative' : 'money-neutral'}>{item.balance > 0 ? `+ ${money(item.balance)}` : item.balance < 0 ? `- ${money(Math.abs(item.balance))}` : 'Em dia'}</span>
          </article>
        ))}
      </div>

      <div className="section-heading section-heading--spaced"><div><span className="eyebrow">MODO SEM CLIMÃO</span><h2>Como fechar este rolê</h2></div></div>
      {group.suggestions.length === 0 ? <EmptyState icon="✨" title="Tudo acertado" text="Não há transferências pendentes pelos saldos atuais." /> : (
        <div className="suggestion-list">
          {group.suggestions.map((suggestion, index) => {
            const canPay = user.role === 'ADMIN' || suggestion.payer.id === user.id;
            return (
              <article className="suggestion" key={`${suggestion.payer.id}-${suggestion.receiver.id}-${index}`}>
                <div className="suggestion__people"><Avatar name={suggestion.payer.name} /><span>→</span><Avatar name={suggestion.receiver.name} /></div>
                <div><strong>{suggestion.payer.name} paga {money(suggestion.amount)} para {suggestion.receiver.name}</strong><p>Uma transferência a menos para encerrar as contas.</p></div>
                {canPay && <button className="button button--small button--primary" onClick={() => onSettle(suggestion)}>Informar pagamento</button>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Settlements({ group, user, onReload }) {
  const [error, setError] = useState('');
  async function status(id, value) {
    try {
      await api(`/settlements/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: value }) });
      onReload();
    } catch (err) { setError(err.message); }
  }

  if (group.settlements.length === 0) return <EmptyState icon="🤝" title="Nenhum acerto informado" text="Quando alguém registrar um pagamento, ele aparecerá aqui para confirmação." />;

  return (
    <div>
      <Feedback>{error}</Feedback>
      <div className="section-heading"><div><span className="eyebrow">PAGAMENTOS REGISTRADOS</span><h2>Histórico de acertos</h2></div></div>
      <div className="settlement-list">
        {group.settlements.map((item) => {
          const canConfirm = user.role === 'ADMIN' || item.receiver.id === user.id;
          return (
            <article className="settlement-row" key={item.id}>
              <div className="settlement-row__route"><Avatar name={item.payer.name} /><span>→</span><Avatar name={item.receiver.name} /></div>
              <div className="settlement-row__main"><strong>{item.payer.name} → {item.receiver.name}</strong><p>{item.method} · {shortDate(item.createdAt)}{item.note ? ` · ${item.note}` : ''}</p></div>
              <strong>{money(item.amount)}</strong>
              <StatusBadge status={item.status} label={item.status === 'PENDING' ? 'Aguardando confirmação' : undefined} />
              <div className="row-actions">
                {canConfirm && item.status === 'PENDING' && <><button onClick={() => status(item.id, 'CONFIRMED')}>Confirmar</button><button className="danger-link" onClick={() => status(item.id, 'REJECTED')}>Recusar</button></>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Members({ group, canManage, onAdd, onDelete }) {
  return (
    <div>
      <div className="section-heading"><div><span className="eyebrow">PARTICIPANTES</span><h2>Pessoas do grupo</h2></div>{canManage && <button className="button button--primary button--small" onClick={onAdd}>＋ Adicionar</button>}</div>
      <div className="member-grid">
        {group.members.map((member) => (
          <article className="member-card" key={member.id}>
            <Avatar name={member.user.name} size="lg" />
            <div><strong>{member.user.name}</strong><span>{member.user.email}</span>{member.user.id === group.createdBy.id && <small>Criador do grupo</small>}</div>
            {canManage && member.user.id !== group.createdBy.id && <button className="icon-button icon-button--danger" onClick={() => onDelete(member)}>×</button>}
          </article>
        ))}
      </div>
    </div>
  );
}

function ExpenseModal({ group, categories, expense, onClose, onSaved }) {
  const editing = Boolean(expense);
  const initialParticipants = expense ? expense.shares.map((share) => share.user.id) : group.members.map((member) => member.user.id);
  const [form, setForm] = useState({
    title: expense?.title || '',
    description: expense?.description || '',
    amount: expense ? Number(expense.amount) : '',
    date: inputDate(expense?.date),
    payerId: expense?.payer.id || group.members[0]?.user.id,
    categoryId: expense?.category.id || categories[0]?.id,
    participantIds: initialParticipants,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleParticipant(userId) {
    setForm((current) => ({
      ...current,
      participantIds: current.participantIds.includes(userId)
        ? current.participantIds.filter((id) => id !== userId)
        : [...current.participantIds, userId],
    }));
  }

  const perPerson = form.participantIds.length && form.amount ? Number(form.amount) / form.participantIds.length : 0;

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const path = editing ? `/expenses/${expense.id}` : `/groups/${group.id}/expenses`;
      await api(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title={editing ? 'Editar despesa' : 'Nova despesa'} subtitle="A divisão é feita igualmente entre as pessoas selecionadas." onClose={onClose} wide>
      <form className="form-stack" onSubmit={submit}>
        <Feedback>{error}</Feedback>
        <div className="form-grid">
          <label className="field field--span-2"><span>Título</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Compras do mercado" required /></label>
          <label className="field"><span>Valor total</span><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" required /></label>
          <label className="field"><span>Data</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
          <label className="field"><span>Quem pagou?</span><select value={form.payerId} onChange={(e) => setForm({ ...form, payerId: Number(e.target.value) })}>{group.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
          <label className="field"><span>Categoria</span><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>{categories.filter((category) => category.active || category.id === expense?.category.id).map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}</select></label>
          <label className="field field--span-2"><span>Observação</span><textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalhes opcionais" /></label>
        </div>
        <div className="participant-box">
          <div><strong>Quem participa desta despesa?</strong><span>{form.participantIds.length} selecionados · {money(perPerson)} para cada</span></div>
          <div className="participant-options">
            {group.members.map((member) => <label key={member.user.id} className={form.participantIds.includes(member.user.id) ? 'selected' : ''}><input type="checkbox" checked={form.participantIds.includes(member.user.id)} onChange={() => toggleParticipant(member.user.id)} /><Avatar name={member.user.name} size="sm" /><span>{member.user.name}</span></label>)}
          </div>
        </div>
        <div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Adicionar despesa'}</button></div>
      </form>
    </Modal>
  );
}

function SettlementModal({ group, user, suggestion, onClose, onSaved }) {
  const [form, setForm] = useState({
    payerId: suggestion?.payer.id || user.id,
    receiverId: suggestion?.receiver.id || group.members.find((m) => m.user.id !== user.id)?.user.id,
    amount: suggestion?.amount || '',
    method: 'PIX',
    note: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await api(`/groups/${group.id}/settlements`, { method: 'POST', body: JSON.stringify(form) });
      onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title="Informar pagamento" subtitle="O dinheiro é enviado fora do Rachô. Aqui fica apenas o registro." onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Feedback>{error}</Feedback>
        <div className="payment-notice"><span>!</span><p>Este botão não faz Pix nem transferência. A pessoa que recebe ainda precisará confirmar o acerto.</p></div>
        <label className="field"><span>Quem pagou?</span><input value={group.members.find((member) => member.user.id === Number(form.payerId))?.user.name || ''} readOnly /></label>
        <label className="field"><span>Quem recebeu?</span><input value={group.members.find((member) => member.user.id === Number(form.receiverId))?.user.name || ''} readOnly /></label>
        <div className="form-grid">
          <label className="field"><span>Valor</span><input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
          <label className="field"><span>Forma usada</span><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option>PIX</option><option>DINHEIRO</option><option>TRANSFERÊNCIA</option><option>OUTRO</option></select></label>
        </div>
        <label className="field"><span>Observação</span><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Opcional" /></label>
        <div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : 'Registrar pagamento'}</button></div>
      </form>
    </Modal>
  );
}

function MemberModal({ group, onClose, onSaved }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try { await api(`/groups/${group.id}/members`, { method: 'POST', body: JSON.stringify({ email }) }); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return (
    <Modal title="Adicionar pessoa" subtitle="A pessoa precisa ter uma conta cadastrada no Rachô." onClose={onClose}>
      <form className="form-stack" onSubmit={submit}><Feedback>{error}</Feedback><label className="field"><span>E-mail da pessoa</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" required /></label><div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Adicionando...' : 'Adicionar ao grupo'}</button></div></form>
    </Modal>
  );
}

function GroupEditModal({ group, onClose, onSaved }) {
  const [form, setForm] = useState({ name: group.name, description: group.description || '', coverEmoji: group.coverEmoji });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try { await api(`/groups/${group.id}`, { method: 'PATCH', body: JSON.stringify(form) }); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return (
    <Modal title="Editar grupo" subtitle="Altere o nome, a descrição ou o emoji do grupo." onClose={onClose}>
      <form className="form-stack" onSubmit={submit}><Feedback>{error}</Feedback><div className="form-grid"><label className="field"><span>Emoji</span><input value={form.coverEmoji} maxLength="4" onChange={(e) => setForm({ ...form, coverEmoji: e.target.value })} /></label><label className="field"><span>Nome</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label className="field field--span-2"><span>Descrição</span><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label></div><div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></div></form>
    </Modal>
  );
}
