// Importa ferramentas de construção.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configura o servidor do frontend.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
