// Formata valores na moeda brasileira.
export const formatarDinheiro = (valor) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(valor || 0));

// Formata datas para exibição curta.
export const formatarDataCurta = (valor) => new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}).format(new Date(valor));

// Converte datas para campos HTML.
export const dataParaInput = (valor) => {
  if (!valor) return new Date().toISOString().slice(0, 10);
  return new Date(valor).toISOString().slice(0, 10);
};

// Extrai iniciais de um nome.
export const obterIniciais = (nome = '') => nome
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase();
