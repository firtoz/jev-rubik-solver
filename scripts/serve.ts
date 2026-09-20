import { resolve, sep } from 'node:path';
const root = resolve('dist/client');
const entry = await import(resolve('dist/server/server.js'));
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  idleTimeout: 255,
  async fetch(request) {
    const url = new URL(request.url);
    const filePath = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (filePath.startsWith(root + sep)) {
      const file = Bun.file(filePath);
      if (await file.exists()) return new Response(file);
    }
    return entry.default.fetch(request);
  },
});
console.log(`Cube Lab: ${server.url}`);
