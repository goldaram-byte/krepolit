// In-memory sliding-window rate limiter, keyed by IP.
// Sufficient for a single Node process behind nginx (see SPEC.md §2, no
// Docker/cluster in the MVP). If the app ever runs multiple instances,
// swap this for a shared store (e.g. Redis).

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (hits.get(ip) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}

// Periodically drop stale entries so the map doesn't grow forever.
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, timestamps] of hits) {
      const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
      if (fresh.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, fresh);
      }
    }
  },
  WINDOW_MS,
).unref();
