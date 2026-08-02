// Importa o formatador de iniciais.
import { obterIniciais } from '../utils/format.js';

// Exibe as iniciais do usuário.
export default function Avatar({ nome, tamanho = 'md' }) {
  return <span className={`avatar avatar--${tamanho}`}>{obterIniciais(nome)}</span>;
}
