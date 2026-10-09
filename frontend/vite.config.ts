import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

const ENV_DIR = '..';
const DEFAULT_BACKEND_PORT = '3000';
const backendPort = loadEnv('development', ENV_DIR, '').BACKEND_PORT ?? DEFAULT_BACKEND_PORT;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local runs share the monorepo root .env; Docker passes VITE_* as build args.
  envDir: ENV_DIR,
  // Same-origin proxy for `npm run dev`, mirroring nginx in Docker, so the session cookie just works.
  server: { proxy: { '/api': `http://localhost:${backendPort}` } },
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
