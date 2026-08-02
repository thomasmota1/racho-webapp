// Traduz os status disponíveis.
const rotulos = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Recusado',
  ACTIVE: 'Ativo',
};

// Exibe o status com estilo.
export default function IndicadorStatus({ status, rotulo }) {
  // Escolhe a aparência do status.
  const estilo = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
    ACTIVE: 'confirmed',
  }[status] || 'neutral';

  return <span className={`status status--${estilo}`}>{rotulo || rotulos[status] || status}</span>;
}
