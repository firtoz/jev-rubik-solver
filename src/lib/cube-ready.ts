/** Module import alone is not readiness: geometry, WebGL and the first frame must finish. */
export async function waitForCubeRender(player: {
  experimentalCurrentThreeJSPuzzleObject(): Promise<unknown>;
  experimentalCurrentVantages(): Promise<Iterable<{ render(): Promise<void> }>>;
}) {
  await player.experimentalCurrentThreeJSPuzzleObject();
  const vantages = await player.experimentalCurrentVantages();
  await Promise.all(Array.from(vantages, vantage => vantage.render()));
}
