// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/cn-study-words/',
  server: {
    proxy: {
      // APIリクエストをNginx（Docker）に転送
      '/cn-study-words/api': {
        target: 'http://localhost:3001', // server.jsが3001で動いているため
        changeOrigin: true,
        secure: false,
      },
    },
  },
});