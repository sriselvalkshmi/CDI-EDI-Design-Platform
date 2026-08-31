import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared/engineering': path.resolve(__dirname, '../shared/engineering'),
      '@engineering': path.resolve(__dirname, '../shared/engineering'),
      '@shared': path.resolve(__dirname, '../shared'),
      '@components': path.resolve(__dirname, './src/components'),
      '@data': path.resolve(__dirname, './src/data'),
      '@services': path.resolve(__dirname, './src/services'),
      '@context': path.resolve(__dirname, './src/context')
    }
  },
  server: {
    port: 5173
  }
});
