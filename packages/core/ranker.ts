import type { Signal } from "./signal.js";
import { fitBand, type ArbitrageAnalysis, type FitBand } from "./lenses.config.js";

export interface RankedItem {
  signal: Signal;
  analysis: ArbitrageAnalysis;
}

const BAND_RANK: Record<FitBand, number> = { pursue: 0, watch: 1, kill: 2 };

/** Tazelik zaman damgası (posted_at yoksa fetched_at). */
function freshnessTs(s: Signal): number {
  const iso = s.posted_at ?? s.fetched_at;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * v1 sıralayıcı: önce fit bandı (pursue > watch > kill), sonra BANT İÇİNDE tazelik
 * tiebreak (skora karışmaz — eski-yüksek yeni-düşüğü ezemez, tersi de). fit son tiebreak.
 */
export function rank(items: RankedItem[]): RankedItem[] {
  return [...items].sort((a, b) => {
    const band = BAND_RANK[fitBand(a.analysis.fit)] - BAND_RANK[fitBand(b.analysis.fit)];
    if (band !== 0) return band;
    const fresh = freshnessTs(b.signal) - freshnessTs(a.signal);
    if (fresh !== 0) return fresh;
    return b.analysis.fit - a.analysis.fit;
  });
}
