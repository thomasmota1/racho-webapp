// Define o endereço base da API.
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

// Envia requisições autenticadas ao backend.
export async function requisicaoApi(caminho, opcoes = {}) {
  // Recupera o token armazenado.
  const token = localStorage.getItem('racho_token');
  // Monta e envia a requisição.
  const resposta = await fetch(`${URL_API}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  // Trata respostas sem conteúdo.
  if (resposta.status === 204) return null;
  // Converte a resposta recebida.
  const dados = await resposta.json().catch(() => ({}));

  // Propaga mensagens de erro.
  if (!resposta.ok) {
    throw new Error(dados.message || 'Não foi possível concluir a operação.');
  }

  // Entrega os dados processados.
  return dados;
}
