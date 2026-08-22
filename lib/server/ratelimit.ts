/**
 * Rate limiting fixed-window in-memory (PRD §45).
 *
 * ponytail: Map per-instance — cukup utk single-region Vercel dev/MVP.
 * Kalau traffic naik/multi-instance, ganti ke Upstash Redis (API sama).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}

export function rateLimit(
  req: Request,
  scope: string,
  max: number,
  windowMs: number,
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > max) {
    throw Object.assign(new Error(`terlalu banyak request — coba lagi nanti`), {
      status: 429,
    });
  }
}
