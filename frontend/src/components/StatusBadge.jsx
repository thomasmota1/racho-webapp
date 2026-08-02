const labels = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Recusado',
  ACTIVE: 'Ativo',
};

export default function StatusBadge({ status, label }) {
  const tone = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    ACTIVE: 'confirmed',
  }[status] || 'neutral';

  return <span className={`status status--${tone}`}>{label || labels[status] || status}</span>;
}
