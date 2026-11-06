/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// The CSP <meta> in index.html is for the static (S3) build; the dev server needs inline HMR scripts, so drop it there.
const devNoCsp = (): Plugin => ({
  name: 'dev-no-csp',
  apply: 'serve',
  transformIndexHtml: (html) => html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, ''),
});

// Environments: local = `npm start` (loads .env.local), dev = `--mode dev` (.env.dev), prod = `--mode prod` (.env.prod). Vite reserves the mode name "local". Output is a static bundle for S3/CloudFront.
export default defineConfig(({ mode }) => ({
  plugins: [react(), devNoCsp()],
  server: { port: Number(process.env.PORT ?? 5174), strictPort: true },
  build: { outDir: 'dist', sourcemap: mode !== 'prod', target: 'es2022' },
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'], css: false },
}));
