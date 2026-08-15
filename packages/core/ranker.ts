import type { Signal } from "./signal.js";
import { fitBand, lenses, type BaseAnalysis, type Confidence, type FitBand, type Lens } from "./lenses.config.js";

/** Sinyal başına, mercek id'sine göre en fazla bir analiz (bkz. `unique(signal_id,lens)`). */
export interface RankedItem {
  signal: Signal;
  analyses: Record<string, BaseAnalysis>;
}

const BAND_RANK: Record<FitBand, number> = { pursue: 0, watch: 1, kill: 2 };
const CONF_RANK: Record<Confidence, number> = { low: 0, med: 1, high: 2 };

function weightMapFrom(registry: readonly Lens[]): Record<string, number> {
  return Object.fromEntries(registry.map((l) => [l.id, l.weight]));
}
// Yalnız builtin mercekler (arbitraj/beyaz-alan) — `lensRegistry` verilmeyen çağrılarda
// (geriye dönük uyum) davranış birebir eskisiyle aynı kalır.
const DEFAULT_WEIGHTS = weightMapFrom(lenses);

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
 *
 * `lensRegistry` (PLAN.md §11 madde 3, 2026-08-09 sağlamlaştırma): builtin + `/admin/mercekler`de
 * eklenmiş aktif admin-mercekleri birlikte verilirse, custom mercek ağırlığı da doğru hesaba
 * girer. Verilmezse yalnız builtin ağırlıkları kullanılır (eski davranış, admin-mercek ağırlığı
 * yoksayılırdı — bu bir bug'du, ör. admin weight=2 girse bile kompozitte hep 1 sayılıyordu).
 */
export function composite(analyses: Record<string, BaseAnalysis>, lensRegistry?: readonly Lens[]): Composite {
  const weights = lensRegistry ? weightMapFrom(lensRegistry) : DEFAULT_WEIGHTS;
  const items = Object.values(analyses);
  const totalWeight = items.reduce((sum, a) => sum + (weights[a.lens] ?? 1), 0);
  // Ağırlık 0 = "kompozit skora girme, yalnız kartta ikinci görüş ol" (bkz. beyaz-alan merceği).
  // Elde YALNIZ sıfır-ağırlıklı analiz varsa bölme NaN üretirdi — o durumda düz ortalamaya düş,
  // sinyali skorsuz bırakma (bir mercek kapatıldı diye kart sıralamadan düşmemeli).
  const scored = totalWeight > 0 ? items.map((a) => [a.fit, weights[a.lens] ?? 1] as const) : items.map((a) => [a.fit, 1] as const);
  const divisor = scored.reduce((sum, [, w]) => sum + w, 0);
  const fit = Math.round(scored.reduce((sum, [f, w]) => sum + f * w, 0) / divisor);
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

export interface RankOptions {
  /**
   * PLAN.md §10 "geri-besleme döngüsü": insan kararları ranker'ı ayarlar. Verilirse bir
   * sinyal için AI bandının yerine geçer (ör. insan zaten "ele" demişse, AI "kovala" dese
   * bile o sinyal en alta iner). fit/tazelik tiebreak'i AI kompozitinden gelmeye devam eder
   * (override yalnız SIRALAMA bandını değiştirir, kompozit skoru/gerekçeyi değiştirmez).
   */
  bandOverride?: (item: RankedItem) => FitBand | null | undefined;
  /** bkz. `composite()` — verilirse custom admin-mercek ağırlıkları da hesaba girer. */
  lensRegistry?: readonly Lens[];
}

/**
 * Sıralayıcı: önce kompozit fit bandı (pursue > watch > kill), sonra BANT İÇİNDE confidence
 * tiebreak (problem 2: "fırsat ayırt edilemiyor" — düşük güvenli bir "kovala" artık taze
 * diye yüksek güvenli birinin önüne geçemiyor), sonra tazelik (skora karışmaz), fit son.
 */
export function rank(items: RankedItem[], opts: RankOptions = {}): RankedItem[] {
  return [...items].sort((a, b) => {
    const ca = composite(a.analyses, opts.lensRegistry);
    const cb = composite(b.analyses, opts.lensRegistry);
    const bandA = opts.bandOverride?.(a) ?? ca.band;
    const bandB = opts.bandOverride?.(b) ?? cb.band;
    const band = BAND_RANK[bandA] - BAND_RANK[bandB];
    if (band !== 0) return band;
    // CONF_RANK: low=0, high=2 — yüksek güven önce gelsin diye ters (b-a) çıkarılıyor.
    const conf = CONF_RANK[cb.confidence] - CONF_RANK[ca.confidence];
    if (conf !== 0) return conf;
    const fresh = freshnessTs(b.signal) - freshnessTs(a.signal);
    if (fresh !== 0) return fresh;
    return cb.fit - ca.fit;
  });
}
