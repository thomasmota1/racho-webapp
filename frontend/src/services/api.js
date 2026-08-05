const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

// envia requisicoes 
export async function requisicaoApi(caminho, opcoes = {}) {
  // recupera o token
  const token = localStorage.getItem('racho_token');
  const resposta = await fetch(`${URL_API}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  if (resposta.status === 204) return null;
  // convertendo resposta
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.message || 'Não foi possível concluir a operação.');
  }

  return dados;
}
