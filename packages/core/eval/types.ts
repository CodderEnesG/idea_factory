import type { Signal } from "../signal.js";
import type { RecommendedAction, ArbitrageAnalysis } from "../lenses.config.js";
import { shortHash } from "../hash.js";

/** Eval vakası: sinyal + insan onaylı beklenen aksiyon. */
export interface EvalCase {
  signal: Signal;
  expected: RecommendedAction;
  note?: string;
  /** mükerrer-çift stres testi: aynı pairId → aynı aksiyon beklenir. */
  pairId?: string;
}

/** Golden few-shot çapası (prompt'a girer) = FewShotExample ile aynı şekil. */
export interface GoldenCase {
  signal: Signal;
  analysis: ArbitrageAnalysis;
}

/** Kısa yol: eval/golden vakası için tam Signal üret. */
export function makeSignal(
  partial: Pick<Signal, "title" | "summary_raw"> &
    Partial<Pick<Signal, "source" | "type" | "url" | "market" | "sector">>,
): Signal {
  const url = partial.url ?? `https://eval.local/${shortHash(partial.title)}`;
  return {
    id: shortHash(url),
    source: partial.source ?? "eval",
    type: partial.type ?? "launch",
    title: partial.title,
    url,
    summary_raw: partial.summary_raw,
    market: partial.market ?? null,
    sector: partial.sector ?? null,
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: shortHash(`${partial.title}\n${partial.summary_raw}`),
  };
}
