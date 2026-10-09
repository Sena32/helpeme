import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local runs share the monorepo root .env; Docker passes VITE_* as build args.
  envDir: '..',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Design-token tests read src/index.css as raw text.
    css: { include: [/index\.css/] },
    env: { VITE_API_BASE_URL: '/api', TZ: 'America/Sao_Paulo' },
  },
});
