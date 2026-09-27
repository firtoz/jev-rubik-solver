import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
const githubPages = process.env.GITHUB_PAGES === '1';
export default defineConfig({
  plugins: [
    tanstackStart({ prerender: githubPages ? { enabled: true, crawlLinks: true, failOnError: true } : undefined }),
    react(),
  ],
  base: githubPages ? '/jev-rubik-solver/' : '/',
  server: { host: '127.0.0.1', port: 3000 },
  ssr: { external: ['bun:sqlite'] },
});
