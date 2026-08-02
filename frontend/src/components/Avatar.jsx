import { obterIniciais } from '../utils/format.js';

export default function Avatar({ nome, tamanho = 'md' }) {
  return <span className={`avatar avatar--${tamanho}`}>{obterIniciais(nome)}</span>;
}
