import { Link } from 'react-router-dom';
import { formatarDataCurta, formatarDinheiro } from '../../utils/format.js';
import Avatar from '../Avatar.jsx';
import IndicadorStatus from '../StatusBadge.jsx';

export function ResumoAdministracao({ resumo }) {
  return (
    <section className="stats-grid admin-stats">
      <IndicadorAdministracao
        rotulo="Usuários cadastrados"
        valor={resumo.users}
        observacao={`${resumo.activeUsers} ativos`}
      />
      <IndicadorAdministracao
        rotulo="Grupos criados"
        valor={resumo.groups}
        observacao="Em toda a plataforma"
      />
      <IndicadorAdministracao
        rotulo="Despesas registradas"
        valor={resumo.expenses}
        observacao={formatarDinheiro(resumo.totalExpense)}
      />
      <IndicadorAdministracao
        rotulo="Acertos informados"
        valor={resumo.settlements}
        observacao="Todos os status"
      />
    </section>
  );
}

function IndicadorAdministracao({ rotulo, valor, observacao }) {
  return (
    <article className="admin-stat">
      <small>{rotulo}</small>
      <strong>{valor}</strong>
      <span>{observacao}</span>
    </article>
  );
}

function EstruturaTabela({ titulo, sobretitulo, acao, children }) {
  return (
    <section className="content-card admin-table-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{sobretitulo}</span>
          <h2>{titulo}</h2>
        </div>
        {acao}
      </div>
      <div className="table-scroll">{children}</div>
    </section>
  );
}

export function TabelaUsuarios({ usuarios, aoEditar }) {
  return (
    <EstruturaTabela sobretitulo="CONTAS" titulo="Usuários da plataforma">
      <table>
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Cadastro</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>
                <div className="table-person">
                  <Avatar nome={usuario.name} />
                  <span>
                    <strong>{usuario.name}</strong>
                    <small>{usuario.email}</small>
                  </span>
                </div>
              </td>
              <td><span className="role-badge role-badge--small">{usuario.role}</span></td>
              <td>
                <IndicadorStatus
                  status={usuario.active ? 'ACTIVE' : 'REJECTED'}
                  rotulo={usuario.active ? 'Ativo' : 'Desativado'}
                />
              </td>
              <td>{formatarDataCurta(usuario.createdAt)}</td>
              <td>
                <div className="row-actions row-actions--right">
                  <button onClick={() => aoEditar(usuario)}>Editar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </EstruturaTabela>
  );
}

export function TabelaGrupos({ grupos, aoExcluir }) {
  return (
    <EstruturaTabela sobretitulo="TODOS OS ROLÊS" titulo="Grupos cadastrados">
      <table>
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Criador</th>
            <th>Pessoas</th>
            <th>Despesas</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {grupos.map((grupo) => (
            <tr key={grupo.id}>
              <td>
                <div className="table-group">
                  <span>{grupo.coverEmoji}</span>
                  <strong>{grupo.name}</strong>
                </div>
              </td>
              <td>{grupo.createdBy.name}</td>
              <td>{grupo._count.members}</td>
              <td>{grupo._count.expenses}</td>
              <td>
                <div className="row-actions row-actions--right">
                  <Link to={`/groups/${grupo.id}`}>Abrir</Link>
                  <button className="danger-link" onClick={() => aoExcluir(grupo)}>Excluir</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </EstruturaTabela>
  );
}

export function TabelaCategorias({ categorias, aoCriar, aoEditar, aoExcluir }) {
  const botaoCriar = (
    <button className="button button--primary button--small" onClick={aoCriar}>
      ＋ Categoria
    </button>
  );

  return (
    <EstruturaTabela sobretitulo="PADRÕES DO SITE" titulo="Categorias" acao={botaoCriar}>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Cor</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.id}>
              <td>
                <div className="table-group">
                  <span
                    className="category-icon"
                    style={{
                      backgroundColor: `${categoria.color}18`,
                      color: categoria.color,
                    }}
                  >
                    {categoria.icon}
                  </span>
                  <strong>{categoria.name}</strong>
                </div>
              </td>
              <td>
                <span className="color-sample">
                  <i style={{ background: categoria.color }} />
                  {categoria.color}
                </span>
              </td>
              <td>
                <span className={`status status--${categoria.active ? 'confirmed' : 'rejected'}`}>
                  {categoria.active ? 'Ativa' : 'Desativada'}
                </span>
              </td>
              <td>
                <div className="row-actions row-actions--right">
                  <button onClick={() => aoEditar(categoria)}>Editar</button>
                  <button className="danger-link" onClick={() => aoExcluir(categoria)}>Excluir</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </EstruturaTabela>
  );
}
