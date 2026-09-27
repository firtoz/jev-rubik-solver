import './release-check';
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { publicFiles } from './public-files';
const destination = resolve('.data/public-release');
if (existsSync(destination))
  throw Error(
    'Export already exists at .data/public-release. Move it aside before exporting again.',
  );
for (const file of publicFiles()) {
  const target = resolve(destination, file);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(file, target, { errorOnExist: true, force: false });
}
console.log(
  'Public snapshot: ' +
    destination +
    '\nNo Git history, credentials, database, node_modules or local archive included.',
);
