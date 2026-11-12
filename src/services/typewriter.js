export const TYPEWRITER_INTERVAL_MS = 65;

export function getTypedCount(startedAt, now, total) {
  if (!Number.isFinite(startedAt)) return total;
  return Math.min(total, Math.max(0, Math.floor((now - startedAt) / TYPEWRITER_INTERVAL_MS)));
}
