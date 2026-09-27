import catalog from '../references/f2l.json';
export const routines = catalog.rows.map((r) => {
  const c = r.pattern.find((p) => p.kind === 'corner')!,
    e = r.pattern.find((p) => p.kind === 'edge')!;
  return {
    ...r,
    group: `${c.position}-${c.stickers.yellow}`,
    description: `Corner position ${c.position}; down-color sticker faces ${c.stickers.yellow}, front-color sticker ${c.stickers.green}, right-color sticker ${c.stickers.red}. Edge position ${e.position}; front-color sticker faces ${e.stickers.green}, right-color sticker ${e.stickers.red}. Execute ${r.alg} (${r.turns} turns).`,
  };
});
