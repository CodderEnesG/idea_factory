import type { Signal } from "@idea-factory/core";

/** `/admin/toplama`daki "kaynak başına üst sınır" ayarı — en yeni `posted_at`'lere göre
 *  kırpar. `limit` <= 0 ise sınırsız (bugünkü davranış). */
export function limitPerSource(rows: Signal[], limit: number): Signal[] {
  if (limit <= 0 || rows.length <= limit) return rows;
  const sorted = [...rows].sort((a, b) => {
    const ta = a.posted_at ? Date.parse(a.posted_at) : 0;
    const tb = b.posted_at ? Date.parse(b.posted_at) : 0;
    return tb - ta;
  });
  return sorted.slice(0, limit);
}
