import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(root, 'index.html'),
        banhoTosa: path.resolve(root, 'banho-tosa.html'),
        cirurgia: path.resolve(root, 'cirurgia.html'),
        internacao: path.resolve(root, 'internacao.html'),
        insumos: path.resolve(root, 'insumos.html'),
        configuracoes: path.resolve(root, 'configuracoes.html'),
      },
    },
  },
});
