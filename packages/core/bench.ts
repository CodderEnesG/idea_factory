import type { Composite } from "./ranker.js";
import { composite, type RankedItem } from "./ranker.js";
import type { Lens } from "./lenses.config.js";

/**
 * Bench çıtası (BENCH.md §100'e giden yol): kompozit fit ≥ 80 VE kompozit confidence: high.
 * Güven kapısı guard'ı zaten 80+ bandı yalnız high ile geçirir; confidence şartı yine de
 * açık yazılır — bench sorgusu guard'a örtük bağımlı olmasın.
 */
export const BENCH_MIN_FIT = 80;

export function isBench(c: Pick<Composite, "fit" | "confidence">): boolean {
  return c.fit >= BENCH_MIN_FIT && c.confidence === "high";
}

/** Havuz adayları — sıralama çağıranın işi (rank + filter kompoze edilir).
 *  `lensRegistry` verilirse custom admin-mercek ağırlıkları da kompozite girer (bkz. ranker.ts). */
export function benchItems(items: RankedItem[], lensRegistry?: readonly Lens[]): RankedItem[] {
  return items.filter((i) => isBench(composite(i.analyses, lensRegistry)));
}
