import { initials } from '../utils/format.js';

export default function Avatar({ name, size = 'md' }) {
  return <span className={`avatar avatar--${size}`}>{initials(name)}</span>;
}
