const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('racho_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível concluir a operação.');
  }

  return data;
}
