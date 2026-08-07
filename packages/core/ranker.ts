import type { Signal } from "./signal.js";
import { fitBand, lenses, type BaseAnalysis, type Confidence, type FitBand } from "./lenses.config.js";

/** Sinyal başına, mercek id'sine göre en fazla bir analiz (bkz. `unique(signal_id,lens)`). */
export interface RankedItem {
  signal: Signal;
  analyses: Record<string, BaseAnalysis>;
}

const BAND_RANK: Record<FitBand, number> = { pursue: 0, watch: 1, kill: 2 };
const CONF_RANK: Record<Confidence, number> = { low: 0, med: 1, high: 2 };
const WEIGHT_BY_LENS: Record<string, number> = Object.fromEntries(lenses.map((l) => [l.id, l.weight]));

export interface Composite {
  fit: number;
  confidence: Confidence;
  band: FitBand;
}

/**
 * Kompozit skor (PLAN.md §Bileşen 7): mevcut merceklerin fit'i ağırlıklı ortalanır.
 * Yalnız 1 mercek varsa (bugünün prod verisinin çoğu, ya da tek-mercek dönemi) sonuç o
 * merceğin fit'iyle birebir aynıdır — geriye dönük uyum. confidence en temkinlisi kazanır
 * (şüpheci analist felsefesi: bir mercek "emin değilim" diyorsa kompozit de emin olamaz).
 */
export function composite(analyses: Record<string, BaseAnalysis>): Composite {
  const items = Object.values(analyses);
  const totalWeight = items.reduce((sum, a) => sum + (WEIGHT_BY_LENS[a.lens] ?? 1), 0);
  const fit = Math.round(
    items.reduce((sum, a) => sum + a.fit * (WEIGHT_BY_LENS[a.lens] ?? 1), 0) / totalWeight,
  );
  const confidence = items.reduce<Confidence>(
    (worst, a) => (CONF_RANK[a.confidence] < CONF_RANK[worst] ? a.confidence : worst),
    items[0]?.confidence ?? "low",
  );
  return { fit, confidence, band: fitBand(fit) };
}

/** Tazelik zaman damgası (posted_at yoksa fetched_at). */
function freshnessTs(s: Signal): number {
  const iso = s.posted_at ?? s.fetched_at;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Sıralayıcı: önce kompozit fit bandı (pursue > watch > kill), sonra BANT İÇİNDE tazelik
 * tiebreak (skora karışmaz — eski-yüksek yeni-düşüğü ezemez, tersi de). fit son tiebreak.
 */
export function rank(items: RankedItem[]): RankedItem[] {
  return [...items].sort((a, b) => {
    const ca = composite(a.analyses);
    const cb = composite(b.analyses);
    const band = BAND_RANK[ca.band] - BAND_RANK[cb.band];
    if (band !== 0) return band;
    const fresh = freshnessTs(b.signal) - freshnessTs(a.signal);
    if (fresh !== 0) return fresh;
    return cb.fit - ca.fit;
  });
}
