import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rollupOptions: {
        input: {
          index: path.resolve(__dirname, 'index.html'),
          banhoTosa: path.resolve(__dirname, 'banho-tosa.html'),
          cirurgia: path.resolve(__dirname, 'cirurgia.html'),
          internacao: path.resolve(__dirname, 'internacao.html'),
          insumos: path.resolve(__dirname, 'insumos.html'),
        },
      },
    },
  };
});
