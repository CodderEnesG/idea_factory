// Basit in-memory kilitleme (madde 4 /cso bulgusu #1: login'de rate limit yoktu).
// Süreç-içi Map — bu app tek uzun-ömürlü Node sürecinde koşuyor (kullanıcı kararı:
// Vercel'e değil `pnpm dev`/`next start`'a devam, bkz. PLAN.md). Serverless/çoklu-instance
// bir deploy'a geçilirse paylaşımlı bir store (ör. Upstash) gerekir — o zaman yeniden
// değerlendirilmeli.

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60_000; // 5 dakika içinde 5 başarısız deneme
const LOCKOUT_MS = 5 * 60_000; // sonra 5 dakika kilit

interface Entry {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

const attempts = new Map<string, Entry>();

/** Kilitliyse kalan ms'i döner, değilse null. */
export function checkLocked(key: string): number | null {
  const e = attempts.get(key);
  if (!e) return null;
  const now = Date.now();
  if (e.lockedUntil > now) return e.lockedUntil - now;
  return null;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.windowStart > WINDOW_MS) {
    attempts.set(key, { failures: 1, windowStart: now, lockedUntil: 0 });
    return;
  }
  e.failures += 1;
  if (e.failures >= MAX_ATTEMPTS) {
    e.lockedUntil = now + LOCKOUT_MS;
  }
}

export function recordSuccess(key: string): void {
  attempts.delete(key);
}
