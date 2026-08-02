const rotulos = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Recusado',
  ACTIVE: 'Ativo',
};

export default function IndicadorStatus({ status, rotulo }) {
  const estilo = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    ACTIVE: 'confirmed',
  }[status] || 'neutral';

  return <span className={`status status--${estilo}`}>{rotulo || rotulos[status] || status}</span>;
}
