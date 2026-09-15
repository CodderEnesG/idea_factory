/**
 * Kaynak-verim ağırlığının saf hesabı — DB'ye dokunmaz. `source-weight.ts`'ten ayrıldı çünkü
 * o dosya `db.ts`'i import ediyor ve `db.ts` yüklenirken SUPABASE_URL istiyor: CI'da env yok,
 * test dosyası daha çalışmadan patlıyordu (2026-09-04'ten 2026-09-15'e kadar CI kırmızıydı).
 */

const MIN_WEIGHT = 0.4;
const MAX_WEIGHT = 2.5;
// Bayes düzeltmesi: küçük örneklemli kaynak (örn. yeni eklenen 6 sektör kaynağı, n<20) tek bir
// şanslı/şanssız sonuçla uç ağırlığa savrulmasın — global ortalamaya doğru çekilir.
const PRIOR_STRENGTH = 15;

export interface SourceStat {
  source: string;
  analyzed: number;
  fit80: number;
}

/** `rows`: her analiz edilmiş sinyal için {source, bestFit}. */
export function computeSourceWeights(rows: { source: string; bestFit: number }[]): Map<string, number> {
  const bySource = new Map<string, SourceStat>();
  let totalAnalyzed = 0;
  let totalFit80 = 0;
  for (const r of rows) {
    const s = bySource.get(r.source) ?? { source: r.source, analyzed: 0, fit80: 0 };
    s.analyzed++;
    if (r.bestFit >= 80) s.fit80++;
    bySource.set(r.source, s);
    totalAnalyzed++;
    if (r.bestFit >= 80) totalFit80++;
  }
  const globalRate = totalAnalyzed > 0 ? totalFit80 / totalAnalyzed : 0.05;

  const weights = new Map<string, number>();
  for (const s of bySource.values()) {
    // Bayes-düzeltilmiş oran: (fit80 + prior*globalRate) / (n + prior).
    const smoothedRate = (s.fit80 + PRIOR_STRENGTH * globalRate) / (s.analyzed + PRIOR_STRENGTH);
    const ratio = globalRate > 0 ? smoothedRate / globalRate : 1;
    weights.set(s.source, Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, ratio)));
  }
  return weights;
}
