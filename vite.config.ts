import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [tanstackStart(), react()],
  server: { host: '127.0.0.1', port: 3000 },
  ssr: { external: ['bun:sqlite'] },
});
