import { isActionableKind, StoredEnrichmentSchema, type Signal } from "@idea-factory/core";

/** Henüz triage edilmemiş sinyal sıralamada kaybolmasın — nötr say (`analyze.ts` deseni). */
export const NEUTRAL_TRIAGE_SCORE = 50;

export interface Candidate {
  signal: Signal;
  score: number;
}

/**
 * Backfill adayları: bu mercekte analizi OLMAYAN + kovalanabilir sinyaller, ucuz ön-tahmin
 * (`triage_score`) sırasına göre. `signals` çağıran tarafından `fetched_at` desc geldiği ve
 * sort stabil olduğu için eşit skorlarda tazelik korunur.
 *
 * `analyze.ts:fetchShortlist` ile aynı eleme kuralları: şema geçmeyen/`signal_kind` null olan
 * satır "sınıf bilinmiyor"dur, elemeden geçirilir (legacy satırları sessizce kaybetmemek için).
 */
export function selectCandidates(signals: Signal[], done: Set<string>): Candidate[] {
  const candidates: Candidate[] = [];
  for (const signal of signals) {
    if (done.has(signal.id)) continue;
    const e = StoredEnrichmentSchema.safeParse(signal.enrichment);
    const actionable = !e.success || e.data.signal_kind === null || isActionableKind(e.data.signal_kind);
    if (!actionable) continue;
    const score = e.success ? (e.data.triage_score ?? NEUTRAL_TRIAGE_SCORE) : NEUTRAL_TRIAGE_SCORE;
    candidates.push({ signal, score });
  }
  return candidates.sort((a, b) => b.score - a.score);
}
