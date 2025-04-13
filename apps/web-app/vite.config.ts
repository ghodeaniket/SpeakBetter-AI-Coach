import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@speakbetter/web': path.resolve(__dirname, '../../packages/web/src'),
      '@speakbetter/core': path.resolve(__dirname, '../../packages/core/src'),
      '@speakbetter/api': path.resolve(__dirname, '../../packages/api/src'),
      '@speakbetter/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@speakbetter/state': path.resolve(__dirname, '../../packages/state/src')
    }
  },
  optimizeDeps: {
    include: ['@speakbetter/web', '@speakbetter/core', '@speakbetter/api', '@speakbetter/ui', '@speakbetter/state']
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
});
