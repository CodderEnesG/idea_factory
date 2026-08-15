// Kaynak sağlığı (PLAN.md §11 madde 10). Kanonik kaynak listesi apps/worker/src/ingest.ts'teki
// SOURCES dizisiyle senkron tutulmalı — yeni bir worker kaynağı eklenince buraya da eklenir.
// tldr.ts alt-kategori başına farklı `source` yazıyor (ör. "tldr:founders") — hepsi "tldr" altında toplanır.
export const KNOWN_SOURCES = ["producthunt", "tldr", "webrazzi", "techcrunch", "ycombinator"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const WARN_AFTER_MS = 2 * DAY_MS; // cron günde 2 kez (07:00/19:00) — 2 gün sessizlik uyarı
const CRITICAL_AFTER_MS = 7 * DAY_MS;

export type SourceStatus = "ok" | "warn" | "critical" | "never";

export interface SourceHealth {
  name: string;
  last7d: number;
  last30d: number;
  lastSeen: Date | null;
  status: SourceStatus;
}

/** Ham `signals.source` değerini kanonik kaynak adına indirger (ör. "tldr:founders" → "tldr"). */
export function canonicalSourceName(raw: string): string {
  return raw.split(":")[0] ?? raw;
}

function statusOf(lastSeen: Date | null, now: Date): SourceStatus {
  if (!lastSeen) return "never";
  const age = now.getTime() - lastSeen.getTime();
  if (age > CRITICAL_AFTER_MS) return "critical";
  if (age > WARN_AFTER_MS) return "warn";
  return "ok";
}

/** `rows` tüm kaynaklardan gelen {source, fetched_at} çiftleri — genelde son 30+ günlük pencere. */
export function computeSourceHealth(
  rows: { source: string; fetched_at: string }[],
  now: Date = new Date(),
): SourceHealth[] {
  const byName = new Map<string, { last7d: number; last30d: number; lastSeen: Date | null }>();
  for (const name of KNOWN_SOURCES) byName.set(name, { last7d: 0, last30d: 0, lastSeen: null });

  for (const row of rows) {
    const name = canonicalSourceName(row.source);
    const ts = Date.parse(row.fetched_at);
    if (Number.isNaN(ts)) continue;
    const entry = byName.get(name) ?? { last7d: 0, last30d: 0, lastSeen: null };
    const age = now.getTime() - ts;
    if (age <= 30 * DAY_MS) entry.last30d++;
    if (age <= 7 * DAY_MS) entry.last7d++;
    if (!entry.lastSeen || ts > entry.lastSeen.getTime()) entry.lastSeen = new Date(ts);
    byName.set(name, entry);
  }

  return [...byName.entries()]
    .map(([name, v]) => ({ name, ...v, status: statusOf(v.lastSeen, now) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
