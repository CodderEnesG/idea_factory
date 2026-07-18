import type { ArbitrageAnalysis } from "./lenses.config.js";
import type { RankedItem } from "./ranker.js";

/**
 * Bench çıtası (BENCH.md §100'e giden yol): analist çıktısı fit ≥ 80 VE confidence: high.
 * Güven kapısı guard'ı zaten 80+ bandı yalnız high ile geçirir; confidence şartı yine de
 * açık yazılır — bench sorgusu guard'a örtük bağımlı olmasın.
 */
export const BENCH_MIN_FIT = 80;

export function isBench(a: Pick<ArbitrageAnalysis, "fit" | "confidence">): boolean {
  return a.fit >= BENCH_MIN_FIT && a.confidence === "high";
}

/** Havuz adayları — sıralama çağıranın işi (rank + filter kompoze edilir). */
export function benchItems(items: RankedItem[]): RankedItem[] {
  return items.filter((i) => isBench(i.analysis));
}
