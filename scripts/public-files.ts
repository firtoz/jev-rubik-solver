import { readdirSync } from 'node:fs';
import { join } from 'node:path';
export const publicRoots = ['src', 'tests', 'public', 'scripts', 'docs', 'research', '.github'];
export const publicTopFiles = [
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  'notes.md',
  'package.json',
  'bun.lock',
  'bunfig.toml',
  'tsconfig.json',
  'vite.config.ts',
  '.gitignore',
  '.prettierrc.json',
  '.env.example',
];
export function publicFiles() {
  const paths = [...publicTopFiles];
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw Error('Public export refuses symlink: ' + join(directory, entry.name));
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else paths.push(path);
    }
  }
  for (const directory of publicRoots) walk(directory);
  return paths.sort();
}
