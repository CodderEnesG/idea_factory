/** `reassess.ts` devam işareti — `analyses`'ta updated_at yok, işlenen satır bu tag'i taşır. */
export const REASSESS_TAG = "reassess:2026-09";
export const REASSESS_MIN_FIT = 50;

export interface AnalysisRow {
  signal_id: string;
  lens: string;
  fit: number;
  tags: unknown;
}

export function hasTag(tags: unknown, tag: string): boolean {
  return Array.isArray(tags) && tags.includes(tag);
}

/**
 * Yeniden değerlendirilecek sinyaller: hedef merceklerden birinde fit ≥ 50 olan ve hedef
 * merceklerdeki satırlarının hepsi REASSESS_TAG taşımayan sinyaller. En yüksek fit önce —
 * kartlarda en görünür olanlar ilk temizlenir.
 *
 * Yeniden analiz fit'i 50 altına düşürürse sinyal kendiliğinden listeden çıkar; 50+ kalan
 * satırlar tag'le işaretli olduğundan tekrar koşu kaldığı yerden devam eder.
 */
export function selectReassessIds(
  rows: AnalysisRow[],
  lensIds: string[],
  minFit = REASSESS_MIN_FIT,
): { todo: string[]; done: number } {
  const bySignal = new Map<string, AnalysisRow[]>();
  for (const r of rows) {
    if (!lensIds.includes(r.lens)) continue;
    bySignal.set(r.signal_id, [...(bySignal.get(r.signal_id) ?? []), r]);
  }

  const todo: { id: string; maxFit: number }[] = [];
  let done = 0;
  for (const [id, rs] of bySignal) {
    const maxFit = Math.max(...rs.map((r) => r.fit));
    if (maxFit < minFit) continue;
    if (rs.every((r) => hasTag(r.tags, REASSESS_TAG))) {
      done++;
      continue;
    }
    todo.push({ id, maxFit });
  }
  todo.sort((a, b) => b.maxFit - a.maxFit);
  return { todo: todo.map((t) => t.id), done };
}

/** Tag'i yinelemeden ekle (başarısız koşu tekrarlanınca `reassess:failed` çoğalmasın). */
export function addTags(tags: unknown, add: string[]): string[] {
  const base = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
  return [...base, ...add.filter((t) => !base.includes(t))];
}
