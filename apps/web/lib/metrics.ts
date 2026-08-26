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

/** Gerçek/kesinleşmiş fırsat sayısı (0013, problem 2: "fırsat ayırt edilemiyor") — AI'ın
 *  "pursue" dediği ham sayı DEĞİL, bir üyenin gerçekten kilitlediği "kovala" sayısı. */
export function finalizedPursueCount(finalDecisions: { decision: Decision }[]): number {
  return finalDecisions.filter((d) => d.decision === "pursue").length;
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

/* ── Kalibrasyon ölçümleri (FAZ6_PLAN.md §Faz 5.5) ─────────────────────────
 *
 * Ayrı bir outcome tablosuna gerek yok: insan kararları SAHİP OLDUĞUMUZ ground truth.
 * Bu ölçümler 2026-08-25'te elle çekilen read-only sorguların kalıcı hâli — kapının ve
 * grounding'in işe yarayıp yaramadığı ancak böyle görülür.
 *
 * ÇEKİNCE (UI'da da yazılı olmalı): bu, *insan incelemesine* karşı kesinliktir ve
 * kovala-bandı sinyallerinin yalnız bir kısmı incelenmiştir. Seçim yanlılığı gerçek —
 * insanlar zaten ilginç görüneni inceliyor.
 */

export type GateState = "n/a" | "pending" | "confirmed" | "caveat" | "vetoed";

export interface PrecisionBucket {
  /** İncelenmiş (insan kararı olan) sinyal sayısı. */
  reviewed: number;
  /** Bunlardan insanın da "kovala" dediği sayı. */
  agreed: number;
  /** agreed / reviewed — payda 0 ise null. */
  precision: number | null;
}

function bucket(rows: { agreed: boolean }[]): PrecisionBucket {
  const reviewed = rows.length;
  const agreed = rows.filter((r) => r.agreed).length;
  return { reviewed, agreed, precision: reviewed ? agreed / reviewed : null };
}

export interface PursuePrecisionInput {
  signalId: string;
  /** Kapıdan geçmiş bant (`resolveGatedBand` sonucu). */
  gatedBand: Decision;
  gate: GateState;
  /** Beyaz-alan kovası: "boş" | "kalabalık" | "karışık" | "belirsiz" (yoksa null). */
  competition: string | null;
}

export interface PursuePrecisionResult {
  /** Kapılı bandı "kovala" olanların insan-kovala kesinliği. Taban (kapısız): %22. */
  overall: PrecisionBucket;
  /** Kapı kırılımı — kapının iş yaptığını kanıtlar. */
  byGate: Record<"confirmed" | "caveat", PrecisionBucket>;
  /** Rekabet kovası kırılımı — beyaz-alanın değerini ölçer (2026-08-26: %40 vs %7, n=10/28). */
  byCompetition: Record<string, PrecisionBucket>;
}

/**
 * Kapılı bandı "kovala" olan ve bir insanın karar verdiği sinyallerde, insanın da "kovala"
 * deme oranı. `latestDecisions`: `latestDecisionPerSignal()` çıktısı.
 */
export function pursuePrecision(
  rows: PursuePrecisionInput[],
  latestDecisions: Map<string, Decision>,
): PursuePrecisionResult {
  const scored = rows
    .filter((r) => r.gatedBand === "pursue" && latestDecisions.has(r.signalId))
    .map((r) => ({ ...r, agreed: latestDecisions.get(r.signalId) === "pursue" }));

  const byCompetition: Record<string, PrecisionBucket> = {};
  for (const key of ["boş", "kalabalık", "karışık", "belirsiz", "yok"]) {
    byCompetition[key] = bucket(scored.filter((r) => (r.competition ?? "yok") === key));
  }

  return {
    overall: bucket(scored),
    byGate: {
      confirmed: bucket(scored.filter((r) => r.gate === "confirmed")),
      caveat: bucket(scored.filter((r) => r.gate === "caveat")),
    },
    byCompetition,
  };
}

/** Tartışma verdict karışımı. 2026-08-25 tabanı: 195 ele / 62 izle / 3 kovala.
 *  Bu dağılım 74/26/0'a geri çökerse kapı kuyruğu boğuyor demektir — ilk burada görünür. */
export function debateVerdictMix(verdicts: Decision[]): Record<Decision, number> {
  const mix: Record<Decision, number> = { pursue: 0, watch: 0, kill: 0 };
  for (const v of verdicts) mix[v]++;
  return mix;
}

/**
 * Beyaz-alan analizlerinin ne kadarı `confidence: low` — grounding'in işe yarayıp
 * yaramadığının TEK ölçütü. Taban (2026-08-26, grounding kapalıyken): 434/662 = %66.
 */
export function groundingCoverage(
  analyses: { lens: string; confidence: string }[],
  lensId = "white_space",
): { total: number; low: number; lowRatio: number | null } {
  const rows = analyses.filter((a) => a.lens === lensId);
  const low = rows.filter((a) => a.confidence === "low").length;
  return { total: rows.length, low, lowRatio: rows.length ? low / rows.length : null };
}
