import {
  analyzeSignal,
  isActionableKind,
  StoredEnrichmentSchema,
  type Signal,
} from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";

const BATCH_LIMIT = Number(process.env["ANALYZE_LIMIT"] ?? "10");
// Tek kaynak partiyi domine etmesin: kaynak başına tavan (bir tick'te TLDR 10/10 alıp
// ProductHunt'ı hiç sıraya sokmuyordu — 64 ürün lansmanı 0 analizle bekliyordu).
const PER_SOURCE_CAP = Number(process.env["ANALYZE_PER_SOURCE_CAP"] ?? "4");

/** Kaynak başına tavan uygulayarak sırayı dolaş; kota dolarsa sıradaki kaynağa geç. */
function balanceBySource(signals: Signal[], limit: number, cap: number): Signal[] {
  const used = new Map<string, number>();
  const picked: Signal[] = [];
  const overflow: Signal[] = [];

  for (const s of signals) {
    if (picked.length >= limit) break;
    const n = used.get(s.source) ?? 0;
    if (n < cap) {
      used.set(s.source, n + 1);
      picked.push(s);
    } else {
      overflow.push(s);
    }
  }
  // Parti dolmadıysa tavanı aşan artıklarla tamamla (kaynak azsa boş geçmesin).
  for (const s of overflow) {
    if (picked.length >= limit) break;
    picked.push(s);
  }
  return picked;
}

async function fetchUnanalyzed(limit: number): Promise<{ todo: Signal[]; skipped: number }> {
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
    .limit(limit * 20);
  if (sErr) throw new Error(`signals sorgu hatası: ${sErr.message}`);

  const pending = ((signals ?? []) as Signal[]).filter((s) => !done.has(s.id));

  // Zenginleştirme essay/research dediyse analiz etme — LLM çağrısı boşa gider, kuyruğu kirletir.
  const actionable = pending.filter((s) => {
    const e = StoredEnrichmentSchema.safeParse(s.enrichment);
    return !e.success || isActionableKind(e.data.signal_kind);
  });

  return { todo: balanceBySource(actionable, limit, PER_SOURCE_CAP), skipped: pending.length - actionable.length };
}

async function main(): Promise<void> {
  const { todo, skipped } = await fetchUnanalyzed(BATCH_LIMIT);
  console.log(
    `${todo.length} sinyal analiz edilecek (provider=${env.provider()}, model=${env.analysisModel()}` +
      `, kaynak tavanı=${PER_SOURCE_CAP}${skipped > 0 ? `, ${skipped} kovalanamaz sinyal atlandı` : ""})`,
  );

  let ok = 0;
  for (const signal of todo) {
    try {
      const a = await analyzeSignal(signal); // sağlayıcı/model env'den (ANALYSIS_PROVIDER)
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
          model: env.analysisModel(),
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

main()
  .then(() => process.exit(0)) // Vertex/undici keep-alive'ı bekletmesin (cron temiz exit).
  .catch((e) => {
    console.error("analyze başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
