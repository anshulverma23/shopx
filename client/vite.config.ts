import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Backend URL used by the dev-server proxy, so the client can call relative
// paths like `/api/products` in development without hitting CORS. Point
// this at wherever `npm run dev` in /server is listening.
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET || 'https://shopx-ynh5.onrender.com/';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
