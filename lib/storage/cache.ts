// Tiny localStorage-backed cache used for "instant paint" of the
// dashboard + trackers pages. Stores the most-recent event list under
// a versioned key so the page can render with stale-but-real data on
// mount, then swap to fresh data when the network call returns.
//
// Wrapped in try/catch because Safari Private Browsing throws on every
// write; we'd rather drop the cache than crash the page.
const PREFIX = "pippa.cache.v1.";

type Entry<T> = { v: T; t: number };

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (!parsed || typeof parsed.t !== "number") return null;
    if (Date.now() - parsed.t > maxAgeMs) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: Entry<T> = { v: value, t: Date.now() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // ignore — quota or private mode
  }
}
