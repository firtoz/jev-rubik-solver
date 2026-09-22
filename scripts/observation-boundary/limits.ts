export const LIMIT = { requests: 400, dollars: 0.05, concurrency: 4 };
export const RESERVATION = (64000 * 0.042) / 1e6;
export function checkLimits(
  usage: { requests: number; committed: number },
  global: { reservedAndSpent: number; cap: number },
) {
  if (usage.requests >= LIMIT.requests) throw new Error('Study request cap reached');
  if (usage.committed + RESERVATION > LIMIT.dollars)
    throw new Error('Study cost cap reached (includes reservations)');
  if (global.reservedAndSpent + RESERVATION > global.cap)
    throw new Error('Project budget cap reached');
}
