import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
      '/hacienda-api': {
        target: 'https://api.hacienda.go.cr',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/hacienda-api/, ''),
      },
    },
  },
});
