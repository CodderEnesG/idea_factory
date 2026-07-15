import { analyzeSignal, type Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";

const BATCH_LIMIT = Number(process.env["ANALYZE_LIMIT"] ?? "10");

async function fetchUnanalyzed(limit: number): Promise<Signal[]> {
  const { data: analyzed, error: aErr } = await db
    .from("analyses")
    .select("signal_id")
    .eq("lens", "arbitrage");
  if (aErr) throw new Error(`analyses sorgu hatası: ${aErr.message}`);
  const done = new Set((analyzed ?? []).map((r) => r.signal_id as string));

  const { data: signals, error: sErr } = await db
    .from("signals")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit * 4);
  if (sErr) throw new Error(`signals sorgu hatası: ${sErr.message}`);

  return (signals ?? []).filter((s) => !done.has(s.id as string)).slice(0, limit) as Signal[];
}

async function main(): Promise<void> {
  const model = env.analysisModel();
  const todo = await fetchUnanalyzed(BATCH_LIMIT);
  console.log(`${todo.length} sinyal analiz edilecek (model=${model})`);

  let ok = 0;
  for (const signal of todo) {
    try {
      const a = await analyzeSignal(signal, { model, apiKey: env.anthropicKey() });
      const { error } = await db.from("analyses").upsert(
        {
          signal_id: signal.id,
          lens: a.lens,
          fit: a.fit,
          rationale: a.rationale,
          evidence: a.evidence,
          adaptation_notes: a.adaptation_notes,
          risks: a.risks,
          confidence: a.confidence,
          validation_needed: a.validation_needed,
          recommended_action: a.recommended_action,
          tags: a.tags,
          model,
        },
        { onConflict: "signal_id,lens" },
      );
      if (error) throw new Error(error.message);
      ok++;
      console.log(`  ✓ ${a.recommended_action} fit=${a.fit} — ${signal.title.slice(0, 60)}`);
    } catch (e) {
      console.error(`  ✗ ${signal.url}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`bitti: ${ok}/${todo.length} analiz yazıldı`);
}

main().catch((e) => {
  console.error("analyze başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
