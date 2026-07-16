import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { analyzeSignal } from "../analyst.js";
import type { RecommendedAction } from "../lenses.config.js";
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
  let total = 0;

  for (const c of evalCases) {
    let got: RecommendedAction;
    try {
      const a = await analyzeSignal(c.signal, { fewShot: golden });
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
    console.log(`  ${mark} bek=${c.expected} → ${got}  ${c.signal.title.slice(0, 50)}`);
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
