export default function ActionCard({ title, text, action }) {
  return <article className="action-card"><div><strong>{title}</strong><p>{text}</p></div>{action}</article>;
}
