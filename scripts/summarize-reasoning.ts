import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const read = (path: string) => JSON.parse(readFileSync(`experiments/${path}/results.json`, 'utf8'));
const v1 = read('move-prediction-v1'),
  v2 = read('geometric-prediction-v2-development'),
  v3 = read('vector-prediction-v3-development'),
  v4 = read('grid-prediction-v4-development');
const rounds = [1, 2]
  .filter((n) => existsSync(`experiments/grid-search-round-${n}/results.json`))
  .map((n) => ({ round: n, results: read(`grid-search-round-${n}`).summary }));
const validation = existsSync('experiments/grid-prediction-v4-validation/results.json')
  ? read('grid-prediction-v4-validation').summary
  : null;
const data = {
  updatedAt: new Date().toISOString(),
  representations: [
    {
      name: 'Original piece names and turn notation',
      position: v1.summary.positionCorrect,
      sticker: v1.summary.stickerCorrect,
      both: v1.summary.bothCorrect,
    },
    { name: 'Neutral piece name', ...v2.summary[0] },
    { name: '3D coordinates', ...v2.summary[1] },
    { name: 'Layer membership, then 3D prediction', ...v2.summary[2] },
    { name: 'Layer membership, then vector arithmetic', ...v3.summary },
    { name: 'Layer membership, then face diagram', ...v4.summary },
  ],
  rounds,
  validation,
};
writeFileSync('src/lib/reasoning-experiments.json', JSON.stringify(data, null, 2));
