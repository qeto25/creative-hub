/**
 * Rate limiter untuk middleware (Edge runtime).
 *
 * Upstash REST dipakai kalau env tersedia — counter-nya bertahan antar-lambda,
 * jadi batasnya benar-benar berlaku di Vercel.
 * Tanpa env: fallback Map lokal, per-instance (cukup buat dev/preview saja).
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const local = new Map<string, { count: number; reset: number }>();

async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec, 'NX'],
      ]),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Array<{ result?: number }>;
    return Number(json?.[0]?.result ?? 0);
  } catch {
    return null;
  }
}

/** true = boleh lanjut, false = kena limit. */
export async function rateLimit(key: string, limit: number, windowSec = 60): Promise<boolean> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const count = await upstashIncr(key, windowSec);
    // Redis down => jangan blokir trafik sah.
    if (count === null) return true;
    return count <= limit;
  }

  const now = Date.now();
  const rec = local.get(key);
  if (!rec || now > rec.reset) {
    local.set(key, { count: 1, reset: now + windowSec * 1000 });
    return true;
  }
  rec.count += 1;
  if (local.size > 5000) {
    local.forEach((v, k) => {
      if (now > v.reset) local.delete(k);
    });
  }
  return rec.count <= limit;
}