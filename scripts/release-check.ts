import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { publicFiles } from './public-files';
const files = publicFiles();
const failures: string[] = [];
const localEnv = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const key = (process.env.TYPESAFE_API_KEY || localEnv.match(/^TYPESAFE_API_KEY=(.+)$/m)?.[1] || '')
  .trim()
  .replace(/^['"]|['"]$/g, '');
const forbidden =
  /\.(?:sqlite|db)(?:-(?:wal|shm))?$|(?:^|\/)\.env(?!\.example$)|(?:^|\/)(?:node_modules|\.data|\.git)\//;
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /TYPESAFE_API_KEY\s*=\s*["']?(?!test-only-credential|your-|example)[a-zA-Z0-9_-]{24,}/,
];
function inspect(path: string) {
  if (forbidden.test(path)) failures.push(path + ': private file');
  const bytes = readFileSync(path);
  const text = (path.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString();
  if (patterns.some((pattern) => pattern.test(text)) || (key.length > 15 && text.includes(key)))
    failures.push(path + ': possible secret');
}
files.forEach(inspect);
function walkBuilt(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = path + '/' + entry.name;
    if (entry.isDirectory()) walkBuilt(full);
    else {
      inspect(full);
      if (readFileSync(full, 'utf8').includes('https://api.typesafe.ai/v1/systemone'))
        failures.push(full + ': live provider transport in website build');
    }
  }
}
if (existsSync('dist/client')) walkBuilt('dist/client');
if (existsSync('dist/server')) walkBuilt('dist/server');
if (failures.length) throw Error(failures.join('\n'));
console.log(
  `Public allowlist: ${files.length} files; no credential/database matches. This is a targeted check, not a comprehensive security audit.`,
);
