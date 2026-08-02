export function Feedback({ tipo = 'error', children }) {
  if (!children) return null;
  return <div className={`feedback feedback--${tipo}`}>{children}</div>;
}

export function Carregamento({ texto = 'Carregando...' }) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      <span>{texto}</span>
    </div>
  );
}

export function EstadoVazio({ icone = '🧾', titulo, texto, acao }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icone}</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {acao}
    </div>
  );
}
