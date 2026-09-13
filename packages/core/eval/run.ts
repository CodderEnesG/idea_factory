import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { analyzeSignal } from "../analyst.js";
import { enrichSignal, type StoredEnrichment } from "../enrichment.js";
import { ARBITRAGE_SEED_LENS, buildCustomLens, type RecommendedAction } from "../lenses.config.js";
import { golden } from "./golden.js";
import { evalCases } from "./cases.js";

const here = dirname(fileURLToPath(import.meta.url));
// .env.local öncelikli (dotenv array: ilk dosya kazanır), .env fallback.
config({ path: [resolve(here, "../../../.env.local"), resolve(here, "../../../.env")] });

const ACTIONS = ["pursue", "watch", "kill"] as const;

/** Ağırlıklı skor: tam=1.0, komşu=0.5, kovala↔ele=0.0. */
function weight(exp: RecommendedAction, got: RecommendedAction): number {
  if (exp === got) return 1;
  const opposite =
    (exp === "pursue" && got === "kill") || (exp === "kill" && got === "pursue");
  return opposite ? 0 : 0.5;
}

const arbitrageLens = buildCustomLens(ARBITRAGE_SEED_LENS);
// Önce zenginleştir: incumbent sınıflandırması ve guard (e)/(j) yalnız enrichment varken çalışır.
// Kapalıyken eval yalnız analist prompt'unu ölçer (2026-09 öncesi davranış). Çağrı sayısı ~2×.
const ENRICH = process.env["EVAL_ENRICH"] === "true";

function bump(m: Map<string, number>, k: string | null): void {
  const key = k ?? "null";
  m.set(key, (m.get(key) ?? 0) + 1);
}

async function main(): Promise<void> {
  if (evalCases.length === 0) {
    console.log("Eval seti boş — packages/core/eval/cases.ts doldurulmalı (hedef 20 vaka).");
    return;
  }
  console.log(
    `Eval: ${evalCases.length} vaka, ${golden.length} golden few-shot. Golden'dan ayrık.\n` +
      (evalCases.length < 20 ? "⚠ set 20 altında — skor gösterge amaçlı.\n" : ""),
  );

  const matrix: Record<RecommendedAction, Record<RecommendedAction, number>> = {
    pursue: { pursue: 0, watch: 0, kill: 0 },
    watch: { pursue: 0, watch: 0, kill: 0 },
    kill: { pursue: 0, watch: 0, kill: 0 },
  };
  const pairs = new Map<string, RecommendedAction[]>();
  const kinds = new Map<string, number>();
  const segments = new Map<string, number>();
  const breadths = new Map<string, number>();
  let total = 0;

  for (const c of evalCases) {
    let got: RecommendedAction;
    let enrTag = "";
    try {
      let signal = c.signal;
      if (ENRICH) {
        const e = await enrichSignal(c.signal, null);
        const stored: StoredEnrichment = {
          ...e,
          fetch_ok: false,
          model: "eval",
          page_chars: null,
          triage_score: null,
          triage_reason: null,
        };
        signal = { ...c.signal, enrichment: stored };
        bump(kinds, e.signal_kind);
        bump(segments, e.target_segment);
        bump(breadths, e.audience_breadth);
        enrTag = ` [${e.signal_kind} · ${e.target_segment}/${e.audience_breadth}/${e.pitch_clarity}]`;
      }
      const a = await analyzeSignal(signal, arbitrageLens, { fewShot: golden });
      got = a.recommended_action;
    } catch (e) {
      console.error(`  ✗ ${c.signal.title.slice(0, 50)}:`, e instanceof Error ? e.message : e);
      continue;
    }
    const w = weight(c.expected, got);
    total += w;
    matrix[c.expected][got]++;
    if (c.pairId) pairs.set(c.pairId, [...(pairs.get(c.pairId) ?? []), got]);
    const mark = w === 1 ? "✓" : w === 0.5 ? "~" : "✗";
    console.log(`  ${mark} bek=${c.expected} → ${got}  ${c.signal.title.slice(0, 50)}${enrTag}`);
  }

  if (ENRICH) {
    const fmt = (m: Map<string, number>) => [...m].map(([k, v]) => `${k}=${v}`).join(" · ");
    console.log(`\nZenginleştirme dağılımı:\n  tip: ${fmt(kinds)}\n  segment: ${fmt(segments)}\n  genişlik: ${fmt(breadths)}`);
  }

  console.log(`\nAğırlıklı skor: ${(total / evalCases.length).toFixed(3)} (${total}/${evalCases.length})`);

  console.log("\n3×3 Confusion (satır=beklenen, sütun=tahmin):");
  console.log(`         ${ACTIONS.map((a) => a.padStart(7)).join("")}`);
  for (const exp of ACTIONS) {
    console.log(`  ${exp.padEnd(7)}${ACTIONS.map((g) => String(matrix[exp][g]).padStart(7)).join("")}`);
  }

  if (pairs.size > 0) {
    console.log("\nMükerrer-çift tutarlılık:");
    for (const [id, actions] of pairs) {
      const consistent = new Set(actions).size === 1;
      console.log(`  ${consistent ? "✓" : "✗"} ${id}: ${actions.join(", ")}`);
    }
  }
}

main().catch((e) => {
  console.error("eval başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
