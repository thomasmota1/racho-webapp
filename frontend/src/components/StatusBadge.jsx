const labels = {
  PENDING: 'Pendente',
  INFORMED: 'Informado',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Recusado',
  ACTIVE: 'Ativo',
  ARCHIVED: 'Arquivado',
};

export default function StatusBadge({ status, label }) {
  const tone = {
    PENDING: 'pending',
    INFORMED: 'informed',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    ACTIVE: 'confirmed',
    ARCHIVED: 'pending',
  }[status] || 'neutral';

  return <span className={`status status--${tone}`}>{label || labels[status] || status}</span>;
}
