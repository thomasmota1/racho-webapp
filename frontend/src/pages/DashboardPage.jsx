import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { money } from '../utils/format.js';
import Modal from '../components/Modal.jsx';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';

const emojis = ['🎉', '🏖️', '🔥', '🏠', '🎓', '🎁', '🚗', '🍕'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    try {
      setData(await api('/groups/dashboard'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  if (!data && !error) return <Loading label="Montando sua visão geral..." />;

  return (
    <>
      <section className="hero-card">
        <div>
          <span className="eyebrow">RESUMO DOS SEUS GRUPOS</span>
          <h2>{data?.summary.net >= 0 ? 'Tudo sob controle.' : 'Alguns acertos ainda estão abertos.'}</h2>
          <p>Os valores abaixo consideram apenas pagamentos que já foram confirmados.</p>
        </div>
        <button className="button button--light" onClick={() => setShowCreate(true)}>＋ Novo grupo</button>
      </section>

      <Feedback>{error}</Feedback>

      <section className="stats-grid">
        <Stat label="Você recebe" value={money(data?.summary.receives)} note="Créditos nos grupos" tone="positive" />
        <Stat label="Você deve" value={money(data?.summary.owes)} note="Valores a acertar" tone="negative" />
        <Stat label="Pendências" value={data?.summary.pendingSettlements || 0} note="Pagamentos aguardando confirmação" tone="warning" />
        <Stat label="Grupos ativos" value={data?.summary.groupCount || 0} note={`${money(data?.summary.totalExpenses)} registrados`} tone="neutral" />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><span className="eyebrow">SEUS ROLÊS</span><h2>Grupos recentes</h2></div>
          <button className="text-button" onClick={() => setShowCreate(true)}>Criar novo</button>
        </div>

        {data?.groups.length === 0 ? (
          <EmptyState icon="🎈" title="Nenhum grupo por aqui" text="Crie seu primeiro grupo para começar a dividir despesas." action={<button className="button button--primary" onClick={() => setShowCreate(true)}>Criar grupo</button>} />
        ) : (
          <div className="group-grid">
            {data?.groups.map((group) => <GroupCard key={group.id} group={group} />)}
          </div>
        )}
      </section>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </>
  );
}

function Stat({ label, value, note, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__dot" />
      <small>{label}</small>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function GroupCard({ group }) {
  const balanceClass = group.ownBalance > 0 ? 'positive' : group.ownBalance < 0 ? 'negative' : 'neutral';
  const balanceText = group.ownBalance > 0 ? `Você recebe ${money(group.ownBalance)}` : group.ownBalance < 0 ? `Você deve ${money(Math.abs(group.ownBalance))}` : 'Tudo acertado';

  return (
    <Link className="group-card" to={`/groups/${group.id}`}>
      <div className="group-card__top">
        <span className="group-emoji">{group.coverEmoji}</span>
        <span className="group-card__arrow">↗</span>
      </div>
      <h3>{group.name}</h3>
      <p>{group.description || 'Sem descrição.'}</p>
      <div className="group-card__meta">
        <span>{group.memberCount} pessoas</span>
        <span>{group.expenseCount} despesas</span>
      </div>
      <footer>
        <span>Total: {money(group.totalExpenses)}</span>
        <strong className={`money-${balanceClass}`}>{balanceText}</strong>
      </footer>
    </Link>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', coverEmoji: '🎉' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      await api('/groups', { method: 'POST', body: JSON.stringify(form) });
      onCreated();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  return (
    <Modal title="Novo grupo" subtitle="Crie um espaço para reunir as despesas." onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <Feedback>{error}</Feedback>
        <div className="emoji-picker">
          {emojis.map((emoji) => <button type="button" key={emoji} className={form.coverEmoji === emoji ? 'selected' : ''} onClick={() => setForm({ ...form, coverEmoji: emoji })}>{emoji}</button>)}
        </div>
        <label className="field"><span>Nome do grupo</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Viagem para Caldas" required /></label>
        <label className="field"><span>Descrição</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que será organizado neste grupo?" rows="3" /></label>
        <div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Criando...' : 'Criar grupo'}</button></div>
      </form>
    </Modal>
  );
}
