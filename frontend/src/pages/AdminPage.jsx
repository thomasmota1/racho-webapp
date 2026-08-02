import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { money, shortDate } from '../utils/format.js';
import Avatar from '../components/Avatar.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { Feedback, Loading } from '../components/Feedback.jsx';

const adminTabs = [
  ['overview', 'Resumo'],
  ['users', 'Usuários'],
  ['groups', 'Grupos'],
  ['categories', 'Categorias'],
];

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  async function load() {
    try {
      const [overview, users, groups, categories] = await Promise.all([
        api('/admin/overview'),
        api('/admin/users'),
        api('/admin/groups'),
        api('/categories'),
      ]);
      setData({ overview, users, groups, categories });
      setError('');
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function deleteResource(path) {
    try { await api(path, { method: 'DELETE' }); load(); } catch (err) { setError(err.message); }
  }

  if (!data && !error) return <Loading label="Carregando o painel administrativo..." />;
  if (!data) return <Feedback>{error}</Feedback>;

  return (
    <>
      <section className="admin-banner">
        <div><span>◇</span><div><strong>Área do proprietário</strong><p>O administrador enxerga e gerencia toda a plataforma.</p></div></div>
        <small>Ações destrutivas são permanentes</small>
      </section>
      <Feedback>{error}</Feedback>
      <nav className="tabs tabs--admin">
        {adminTabs.map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}
      </nav>

      {tab === 'overview' && <AdminOverview overview={data.overview} />}
      {tab === 'users' && <UsersTable users={data.users} onEdit={(item) => setModal({ type: 'user', data: item })} />}
      {tab === 'groups' && <GroupsTable groups={data.groups} onDelete={(item) => setConfirmation({ title: 'Excluir grupo?', message: `O grupo “${item.name}” e suas despesas serão removidos.`, path: `/groups/${item.id}`, label: 'Excluir grupo' })} />}
      {tab === 'categories' && <CategoriesTable categories={data.categories} onNew={() => setModal({ type: 'category' })} onEdit={(item) => setModal({ type: 'category', data: item })} onDelete={(item) => setConfirmation({ title: 'Excluir categoria?', message: `A categoria “${item.name}” será removida.`, path: `/categories/${item.id}`, label: 'Excluir categoria' })} />}

      {modal?.type === 'user' && <UserModal user={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'category' && <CategoryModal category={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} confirmLabel={confirmation.label} onConfirm={() => deleteResource(confirmation.path)} onClose={() => setConfirmation(null)} />}
    </>
  );
}

function AdminOverview({ overview }) {
  return (
    <div>
      <section className="stats-grid admin-stats">
        <AdminStat label="Usuários cadastrados" value={overview.users} note={`${overview.activeUsers} ativos`} />
        <AdminStat label="Grupos criados" value={overview.groups} note="Em toda a plataforma" />
        <AdminStat label="Despesas registradas" value={overview.expenses} note={money(overview.totalExpense)} />
        <AdminStat label="Acertos informados" value={overview.settlements} note="Todos os status" />
      </section>
      <section className="content-card admin-explanation">
        <span className="eyebrow">COMO FUNCIONA A PERMISSÃO</span>
        <h2>Administrador não é organizador de um rolê.</h2>
        <p>Ele é o responsável pela aplicação inteira. Por isso, pode abrir qualquer grupo, alterar despesas, confirmar ou recusar acertos, criar categorias e gerenciar o acesso dos usuários.</p>
        <div className="permission-flow"><span>Login</span><b>→</b><span>Token identifica o perfil</span><b>→</b><span>Middleware verifica ADMIN</span><b>→</b><span>Ação liberada</span></div>
      </section>
    </div>
  );
}

function AdminStat({ label, value, note }) {
  return <article className="admin-stat"><small>{label}</small><strong>{value}</strong><span>{note}</span></article>;
}

function TableShell({ title, eyebrow, action, children }) {
  return <section className="content-card admin-table-card"><div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{action}</div><div className="table-scroll">{children}</div></section>;
}

function UsersTable({ users, onEdit }) {
  return (
    <TableShell eyebrow="CONTAS" title="Usuários da plataforma">
      <table><thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th /></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="table-person"><Avatar name={item.name} /><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td><td><span className="role-badge role-badge--small">{item.role}</span></td><td><StatusBadge status={item.active ? 'ACTIVE' : 'REJECTED'} label={item.active ? 'Ativo' : 'Desativado'} /></td><td>{shortDate(item.createdAt)}</td><td><div className="row-actions row-actions--right"><button onClick={() => onEdit(item)}>Editar</button></div></td></tr>)}</tbody></table>
    </TableShell>
  );
}

function GroupsTable({ groups, onDelete }) {
  return (
    <TableShell eyebrow="TODOS OS ROLÊS" title="Grupos cadastrados">
      <table><thead><tr><th>Grupo</th><th>Criador</th><th>Pessoas</th><th>Despesas</th><th /></tr></thead><tbody>{groups.map((item) => <tr key={item.id}><td><div className="table-group"><span>{item.coverEmoji}</span><strong>{item.name}</strong></div></td><td>{item.createdBy.name}</td><td>{item._count.members}</td><td>{item._count.expenses}</td><td><div className="row-actions row-actions--right"><Link to={`/groups/${item.id}`}>Abrir e editar</Link><button className="danger-link" onClick={() => onDelete(item)}>Excluir</button></div></td></tr>)}</tbody></table>
    </TableShell>
  );
}

function CategoriesTable({ categories, onNew, onEdit, onDelete }) {
  return (
    <TableShell eyebrow="PADRÕES DO SITE" title="Categorias" action={<button className="button button--primary button--small" onClick={onNew}>＋ Categoria</button>}>
      <table><thead><tr><th>Categoria</th><th>Cor</th><th>Status</th><th /></tr></thead><tbody>{categories.map((item) => <tr key={item.id}><td><div className="table-group"><span className="category-icon" style={{ backgroundColor: `${item.color}18`, color: item.color }}>{item.icon}</span><strong>{item.name}</strong></div></td><td><span className="color-sample"><i style={{ background: item.color }} />{item.color}</span></td><td><span className={`status status--${item.active ? 'confirmed' : 'rejected'}`}>{item.active ? 'Ativa' : 'Desativada'}</span></td><td><div className="row-actions row-actions--right"><button onClick={() => onEdit(item)}>Editar</button><button className="danger-link" onClick={() => onDelete(item)}>Excluir</button></div></td></tr>)}</tbody></table>
    </TableShell>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, active: user.active });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) { event.preventDefault(); setSaving(true); setError(''); try { await api(`/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(form) }); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); } }
  return <Modal title="Editar usuário" subtitle="Altere o nome, o perfil ou o acesso à plataforma." onClose={onClose}><form className="form-stack" onSubmit={submit}><Feedback>{error}</Feedback><label className="field"><span>Nome</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><div className="form-grid"><label className="field"><span>Perfil</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="USER">Usuário</option><option value="ADMIN">Administrador</option></select></label><label className="field"><span>Status</span><select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Desativado</option></select></label></div><div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar usuário'}</button></div></form></Modal>;
}

function CategoryModal({ category, onClose, onSaved }) {
  const editing = Boolean(category);
  const [form, setForm] = useState({ name: category?.name || '', icon: category?.icon || '🧾', color: category?.color || '#6558d3', active: category?.active ?? true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) { event.preventDefault(); setSaving(true); setError(''); try { await api(editing ? `/categories/${category.id}` : '/categories', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(form) }); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); } }
  return <Modal title={editing ? 'Editar categoria' : 'Nova categoria'} subtitle="Categorias são definidas pelo administrador para todo o site." onClose={onClose}><form className="form-stack" onSubmit={submit}><Feedback>{error}</Feedback><div className="form-grid"><label className="field"><span>Ícone</span><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></label><label className="field"><span>Cor</span><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label><label className="field field--span-2"><span>Nome</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>{editing && <label className="field field--span-2"><span>Status</span><select value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}><option value="true">Ativa</option><option value="false">Desativada</option></select></label>}</div><div className="form-actions"><button type="button" className="button button--ghost" onClick={onClose}>Cancelar</button><button className="button button--primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar categoria'}</button></div></form></Modal>;
}
