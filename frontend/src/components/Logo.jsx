export default function Logo({ compact = false }) {
  return (
    <div className={`logo ${compact ? 'logo--compact' : ''}`}>
      <span className="logo__mark">R$</span>
      {!compact && <span className="logo__name">Rachô</span>}
    </div>
  );
}
