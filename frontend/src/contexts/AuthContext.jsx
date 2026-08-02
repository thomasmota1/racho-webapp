// Importa recursos de autenticação.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { requisicaoApi } from '../services/api.js';

// Compartilha o estado da sessão.
const ContextoAutenticacao = createContext(null);

// Disponibiliza autenticação aos componentes.
export function ProvedorAutenticacao({ children }) {
  // Armazena usuário e carregamento.
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura uma sessão existente.
  useEffect(() => {
    const token = localStorage.getItem('racho_token');
    if (!token) {
      setCarregando(false);
      return;
    }

    // Busca os dados do usuário.
    requisicaoApi('/auth/me')
      .then(setUsuario)
      .catch(() => localStorage.removeItem('racho_token'))
      .finally(() => setCarregando(false));
  }, []);

  // Autentica usuário com credenciais.
  async function entrar(email, senha) {
    const dados = await requisicaoApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: senha }),
    });
    localStorage.setItem('racho_token', dados.token);
    setUsuario(dados.user);
    return dados.user;
  }

  // Cadastra um novo usuário.
  async function cadastrar(nome, email, senha) {
    const dados = await requisicaoApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: nome, email, password: senha }),
    });
    localStorage.setItem('racho_token', dados.token);
    setUsuario(dados.user);
  }

  // Encerra a sessão atual.
  function sair() {
    localStorage.removeItem('racho_token');
    setUsuario(null);
  }

  // Recarrega os dados pessoais.
  async function atualizarUsuario() {
    const dados = await requisicaoApi('/auth/me');
    setUsuario(dados);
  }

  // Memoriza os recursos compartilhados.
  const valorContexto = useMemo(() => ({
    usuario,
    carregando,
    entrar,
    cadastrar,
    sair,
    atualizarUsuario,
  }), [usuario, carregando]);

  // Entrega o contexto aos filhos.
  return (
    <ContextoAutenticacao.Provider value={valorContexto}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

// Acessa o contexto de autenticação.
export function usarAutenticacao() {
  return useContext(ContextoAutenticacao);
}
