/** Client-side fetch with ok-check. Returns parsed JSON or null on error. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, init);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
