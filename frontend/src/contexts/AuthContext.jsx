import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { requisicaoApi } from '../services/api.js';

const ContextoAutenticacao = createContext(null);

export function ProvedorAutenticacao({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('racho_token');
    if (!token) {
      setCarregando(false);
      return;
    }

    requisicaoApi('/auth/me')
      .then(setUsuario)
      .catch(() => localStorage.removeItem('racho_token'))
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email, senha) {
    const dados = await requisicaoApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: senha }),
    });
    localStorage.setItem('racho_token', dados.token);
    setUsuario(dados.user);
    return dados.user;
  }

  async function cadastrar(nome, email, senha) {
    const dados = await requisicaoApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: nome, email, password: senha }),
    });
    localStorage.setItem('racho_token', dados.token);
    setUsuario(dados.user);
  }

  function sair() {
    localStorage.removeItem('racho_token');
    setUsuario(null);
  }

  async function atualizarUsuario() {
    const dados = await requisicaoApi('/auth/me');
    setUsuario(dados);
  }

  const valorContexto = useMemo(() => ({
    usuario,
    carregando,
    entrar,
    cadastrar,
    sair,
    atualizarUsuario,
  }), [usuario, carregando]);

  return (
    <ContextoAutenticacao.Provider value={valorContexto}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

export function usarAutenticacao() {
  return useContext(ContextoAutenticacao);
}
