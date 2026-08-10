import { composite, type Lens, type RankedItem } from "@idea-factory/core";

export type Decision = "pursue" | "watch" | "kill";

export interface WeeklyQualified {
  weekStart: Date;
  qualified: number;
  total: number;
}

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

function itemTs(item: RankedItem): number | null {
  const iso = item.signal.posted_at ?? item.signal.fetched_at;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function weekStartOf(d: Date): Date {
  const day = (d.getUTCDay() + 6) % 7; // Pazartesi=0 (trend/page.tsx ile aynı kural)
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

/** "Nitelikli fırsat" (BUSINESS_MODEL.md §5, eşik üstü skor) = kompozit bant kill DEĞİL.
 *  `lensRegistry` verilirse custom admin-mercek ağırlıkları da kompozite girer (bkz. ranker.ts). */
export function isQualified(item: RankedItem, lensRegistry?: readonly Lens[]): boolean {
  return composite(item.analyses, lensRegistry).band !== "kill";
}

/** Son `weeks` hafta için haftalık nitelikli-fırsat/toplam sayımı (en eski→en yeni sırayla). */
export function weeklyQualified(
  items: RankedItem[],
  weeks: number,
  now: Date = new Date(),
  lensRegistry?: readonly Lens[],
): WeeklyQualified[] {
  const thisWeek = weekStartOf(now);
  const buckets: WeeklyQualified[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ weekStart: new Date(thisWeek.getTime() - i * MS_WEEK), qualified: 0, total: 0 });
  }
  const byStart = new Map(buckets.map((b) => [b.weekStart.getTime(), b]));
  const earliest = buckets[0]!.weekStart.getTime();

  for (const item of items) {
    const ts = itemTs(item);
    if (ts === null) continue;
    const start = weekStartOf(new Date(ts)).getTime();
    if (start < earliest) continue;
    const bucket = byStart.get(start);
    if (!bucket) continue;
    bucket.total++;
    if (isQualified(item, lensRegistry)) bucket.qualified++;
  }
  return buckets;
}

/** Karşı-metrik/guardrail: analiz edilen sinyallerin ne kadarı "ele" bandında (gürültü). */
export function noiseRatio(items: RankedItem[], lensRegistry?: readonly Lens[]): number {
  if (items.length === 0) return 0;
  const killCount = items.filter((i) => composite(i.analyses, lensRegistry).band === "kill").length;
  return killCount / items.length;
}

/** Karar/sinyal oranı: kuyruk gerçekten aksiyon doğuruyor mu (engagement). */
export function decisionRatio(totalSignals: number, decidedSignalCount: number): number {
  if (totalSignals === 0) return 0;
  return decidedSignalCount / totalSignals;
}

/** Append-only `decisions` log'undan sinyal başına EN YENİ kararı çıkarır — satırlar
 *  created_at DESC sırayla gelmeli (ilk görülen kazanır). */
export function latestDecisionPerSignal(
  rows: { signal_id: string; decision: Decision }[],
): Map<string, Decision> {
  const map = new Map<string, Decision>();
  for (const r of rows) {
    if (!map.has(r.signal_id)) map.set(r.signal_id, r.decision);
  }
  return map;
}
