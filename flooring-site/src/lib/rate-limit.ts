// In-memory sliding-window rate limiter, keyed by an arbitrary string (an
// IP, or `${purpose}:${ip}` to give a purpose its own budget — e.g. admin
// login attempts shouldn't share a bucket with public lead-form submits).
// Sufficient for a single Node process behind nginx (see SPEC.md §2, no
// Docker/cluster in the MVP). If the app ever runs multiple instances,
// swap this for a shared store (e.g. Redis).

const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  options?: { windowMs?: number; max?: number },
): boolean {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX_REQUESTS;

  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

// Periodically drop stale entries so the map doesn't grow forever. Uses the
// default window as a reasonable cleanup cadence even for callers that pass
// a custom one.
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < DEFAULT_WINDOW_MS);
    if (fresh.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, fresh);
    }
  }
}, DEFAULT_WINDOW_MS).unref();
