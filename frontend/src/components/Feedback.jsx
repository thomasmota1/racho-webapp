export function Feedback({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`feedback feedback--${type}`}>{children}</div>;
}

export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="loading-state">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon = '🧾', title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
