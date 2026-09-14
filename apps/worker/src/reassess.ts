import {
  ARBITRAGE_SEED_LENS,
  golden,
  isActionableKind,
  lenses,
  SignalSchema,
  StoredEnrichmentSchema,
  type FewShotExample,
  type Lens,
  type Signal,
} from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";
import { analyzeOne } from "./lib/analyze-one.js";
import { enrichOne } from "./lib/enrich-one.js";
import { supabaseKnowledgeLayer } from "./lib/knowledge-db.js";
import { loadActiveCustomLenses } from "./lib/lenses-db.js";
import {
  addTags,
  REASSESS_MIN_FIT,
  REASSESS_TAG,
  selectReassessIds,
  type AnalysisRow,
} from "./lib/reassess-select.js";
import { loadActiveThesis } from "./lib/thesis-db.js";

/**
 * Geriye dönük yeniden değerlendirme (2026-09-13): fit ≥ 50 sinyalleri yeni zenginleştirme
 * (incumbent ölçütü + kitle/netlik alanları) ve yeni kurallarla (guard j, tez v2) yeniden işler.
 * Ele bandına dokunmaz — zaten görünmüyor.
 *
 * Varsayılan DRY-RUN: yalnız sayım + tahmini LLM çağrısı. Yazmak için `--apply`.
 * Resumable: işlenen satırlar REASSESS_TAG taşır; tekrar koşu kaldığı yerden devam eder.
 *
 * kullanım: pnpm --filter @idea-factory/worker reassess [--apply]
 *   REASSESS_MAX=20 · REASSESS_CONCURRENCY=2 · REASSESS_LENSES=arbitrage[,white_space]
 *
 * Yalnız-analiz geçişi (ör. golden few-shot değişince zenginleştirmeyi tekrar ödememek için):
 *   REASSESS_ANALYZE_ONLY=true — mevcut zenginleştirmeyi kullanır; yeni alanları (one_liner) olmayan atlanır
 *   REASSESS_SEGMENTS=consumer,mixed — yalnız bu target_segment'teki sinyaller
 *   REASSESS_TAG=reassess:2026-09-b2c — önceki geçişin tag'inden bağımsız devam işareti
 */
const APPLY = process.argv.includes("--apply");
const MAX = Number(process.env["REASSESS_MAX"] ?? "20");
// Vertex kotası dar (backfill-lens.ts: 5 paralelde 429); her sinyal enrich + mercek çağrısı yapıyor.
const CONCURRENCY = Math.max(1, Number(process.env["REASSESS_CONCURRENCY"] ?? "2"));
// Varsayılan yalnız arbitraj: kompozit skoru o belirliyor (beyaz-alan ağırlık 0 + grounding maliyeti).
const LENS_IDS = (process.env["REASSESS_LENSES"] ?? ARBITRAGE_SEED_LENS.id).split(",").map((s) => s.trim());
const ANALYZE_ONLY = process.env["REASSESS_ANALYZE_ONLY"] === "true";
const SEGMENTS = process.env["REASSESS_SEGMENTS"]?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const TAG = process.env["REASSESS_TAG"] ?? REASSESS_TAG;
const PAGE = 1000;
const CHUNK = 200;
const FAILED_CAP = 79;
const NON_ACTIONABLE_CAP = 20;

const FEW_SHOT_BY_LENS: Record<string, FewShotExample[]> = { [ARBITRAGE_SEED_LENS.id]: golden };

async function loadAnalysisRows(): Promise<AnalysisRow[]> {
  const rows: AnalysisRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("analyses")
      .select("signal_id, lens, fit, tags")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`analyses sorgu hatası: ${error.message}`);
    const page = (data ?? []) as AnalysisRow[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

async function loadSignals(ids: string[]): Promise<{ signal: Signal; prev: unknown }[]> {
  const out: { signal: Signal; prev: unknown }[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await db.from("signals").select("*").in("id", ids.slice(i, i + CHUNK));
    if (error) throw new Error(`signals sorgu hatası: ${error.message}`);
    for (const r of data ?? []) out.push({ signal: SignalSchema.parse(r), prev: r.enrichment });
  }
  // `.in()` sırayı korumaz — en yüksek fit önce işlensin.
  const order = new Map(ids.map((id, i) => [id, i]));
  return out.sort((a, b) => (order.get(a.signal.id) ?? 0) - (order.get(b.signal.id) ?? 0));
}

async function resolveLenses(): Promise<Lens[]> {
  const all = [...lenses, ...(await loadActiveCustomLenses())];
  return LENS_IDS.map((id) => {
    const l = all.find((x) => x.id === id);
    if (!l) throw new Error(`bilinmeyen mercek: "${id}" (mevcut: ${all.map((x) => x.id).join(", ")})`);
    return l;
  });
}

/** Yeniden sınıflandırmada kovalanamaz çıktı: satırları silmeden ele'ye indir (audit kalır). */
async function killRows(signalId: string, kind: string): Promise<void> {
  const { data, error } = await db
    .from("analyses")
    .select("id, fit, rationale, tags")
    .eq("signal_id", signalId);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) {
    const prefix = `[yeniden sınıflandı: ${kind}] `;
    const { error: upErr } = await db
      .from("analyses")
      .update({
        fit: Math.min(r.fit as number, NON_ACTIONABLE_CAP),
        recommended_action: "kill",
        rationale: (r.rationale as string).startsWith(prefix) ? r.rationale : `${prefix}${r.rationale}`,
        tags: addTags(r.tags, [TAG, `reassess:non_actionable:${kind}`]),
      })
      .eq("id", r.id);
    if (upErr) throw new Error(upErr.message);
  }
}

/** Arbitraj yeniden analizi 4 denemede patladıysa eski (ör. 88) satır kovala'da kalmasın. */
async function capFailed(signalId: string, lensId: string): Promise<void> {
  const { data, error } = await db
    .from("analyses")
    .select("id, fit, tags")
    .eq("signal_id", signalId)
    .eq("lens", lensId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || (data.fit as number) <= FAILED_CAP) return;
  const { error: upErr } = await db
    .from("analyses")
    .update({ fit: FAILED_CAP, recommended_action: "watch", tags: addTags(data.tags, ["reassess:failed"]) })
    .eq("id", data.id);
  if (upErr) throw new Error(upErr.message);
}

async function main(): Promise<void> {
  const rows = await loadAnalysisRows();
  const selected = selectReassessIds(rows, LENS_IDS, REASSESS_MIN_FIT, TAG);
  let todo = selected.todo;
  const { done } = selected;

  // Segment filtresi zenginleştirmeye bakar → önce sinyalleri yükle, sonra süz (MAX'tan ÖNCE).
  let preloaded: { signal: Signal; prev: unknown }[] | null = null;
  if (SEGMENTS || ANALYZE_ONLY) {
    preloaded = (await loadSignals(todo)).filter(({ prev }) => {
      const e = StoredEnrichmentSchema.safeParse(prev);
      if (!e.success) return false;
      if (ANALYZE_ONLY && e.data.one_liner === null) return false;
      return !SEGMENTS || (e.data.target_segment !== null && SEGMENTS.includes(e.data.target_segment));
    });
    todo = preloaded.map((p) => p.signal.id);
  }

  const perSignalCalls =
    (ANALYZE_ONLY ? 0 : 1) + LENS_IDS.length * 1.3 + (LENS_IDS.includes("white_space") ? 3 : 0);
  console.log(
    `[reassess] ${rows.length} analiz satırı · mercekler=${LENS_IDS.join(",")} · tag=${TAG}` +
      `${ANALYZE_ONLY ? " · YALNIZ-ANALİZ" : ""}${SEGMENTS ? ` · segment=${SEGMENTS.join(",")}` : ""} · fit≥${REASSESS_MIN_FIT}: ` +
      `${todo.length} bekleyen, ${done} tamam · tahmini ~${Math.round(todo.length * perSignalCalls)} LLM çağrısı ` +
      `(sinyal başı ~${perSignalCalls.toFixed(1)}; provider=${env.provider()}, model=${env.analysisModel()})`,
  );
  if (!APPLY) {
    console.log("DRY-RUN — yazmak için --apply (REASSESS_MAX ile kademeli).");
    return;
  }

  const batch = preloaded ? preloaded.slice(0, MAX) : await loadSignals(todo.slice(0, MAX));
  const thesis = await loadActiveThesis();
  const targetLenses = await resolveLenses();
  const knowledge = supabaseKnowledgeLayer();
  console.log(`[reassess] ${batch.length} sinyal işlenecek (tez=${thesis.version}, paralel=${CONCURRENCY})`);

  let ok = 0;
  let killed = 0;
  let failed = 0;
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const item = batch[next++];
      if (!item) return;
      try {
        const stored = ANALYZE_ONLY
          ? StoredEnrichmentSchema.parse(item.prev)
          : await enrichOne(item.signal, item.prev, thesis);
        if (!stored) {
          failed++;
          continue;
        }
        if (stored.signal_kind && !isActionableKind(stored.signal_kind)) {
          await killRows(item.signal.id, stored.signal_kind);
          console.log(`  ⊘ ${stored.signal_kind} → ele — ${item.signal.title.slice(0, 60)}`);
          killed++;
          ok++;
          continue;
        }
        // analyzeSignal zenginleştirmeyi signal.enrichment'tan okur — taze olanı ver.
        const signal = { ...item.signal, enrichment: stored };
        let allOk = true;
        for (const lens of targetLenses) {
          const written = await analyzeOne(signal, lens, {
            fewShot: FEW_SHOT_BY_LENS[lens.id] ?? [],
            knowledge,
            thesis,
            extraTags: [TAG],
          });
          if (!written) {
            allOk = false;
            if (lens.id === ARBITRAGE_SEED_LENS.id) await capFailed(item.signal.id, lens.id);
          }
        }
        if (allOk) ok++;
        else failed++;
      } catch (e) {
        failed++;
        console.error(`  ✗ ${item.signal.url}:`, e instanceof Error ? e.message : e);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));

  const remaining = todo.length - ok;
  console.log(
    `[reassess] bitti: ${ok}/${batch.length} tamam (${killed} ele'ye indi, ${failed} başarısız) — ` +
      `${remaining} bekleyen` +
      (remaining > 0 ? ` (~${Math.ceil(remaining / Math.max(MAX, 1))} koşu daha)` : " ✅"),
  );

  if (batch.length > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${batch.length} (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("reassess başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
