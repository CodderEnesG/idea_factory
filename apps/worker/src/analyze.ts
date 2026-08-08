import {
  analyzeSignal,
  arbitrageLens,
  golden,
  isActionableKind,
  lenses,
  StoredEnrichmentSchema,
  type FewShotExample,
  type Signal,
} from "@idea-factory/core";

// golden yalnız arbitraj için kalibre edilmiş (THESIS_AND_LENS.md §3a) — başka mercek yanlış
// hizalanır. Yeni merceğin kendi golden seti yoksa boş few-shot ile başlar.
const FEW_SHOT_BY_LENS: Record<string, FewShotExample[]> = { [arbitrageLens.id]: golden };
import { db } from "./db.js";
import { env } from "./env.js";
import { balanceBySource } from "./lib/balance.js";
import { supabaseKnowledgeLayer } from "./lib/knowledge-db.js";
import { loadActiveThesis } from "./lib/thesis-db.js";

const BATCH_LIMIT = Number(process.env["ANALYZE_LIMIT"] ?? "10");
// Tek kaynak partiyi domine etmesin: kaynak başına tavan (bir tick'te TLDR 10/10 alıp
// ProductHunt'ı hiç sıraya sokmuyordu — 64 ürün lansmanı 0 analizle bekliyordu).
const PER_SOURCE_CAP = Number(process.env["ANALYZE_PER_SOURCE_CAP"] ?? "4");
// Tüm kovalanabilir sinyalleri golden kalibrasyonuyla baştan analiz için (done-atlamasını
// devre dışı bırakır, upsert eski satırın üstüne yazar). enrich.ts FORCE_ENRICH deseni.
const FORCE = process.env["ANALYZE_FORCE"] === "true";
// Henüz triage edilmemiş (triage.ts çalışmadı/başarısız oldu) sinyal kaybolmasın — nötr say.
const NEUTRAL_TRIAGE_SCORE = 50;

/**
 * Tüm merceklerin ortaklaşa çektiği aday havuzu: triage_score'a göre önceliklenir
 * (pahalı çok-mercekli analiz artık tazelik sırasına değil ucuz ön-tahmine göre gider),
 * sonra kaynak-adaleti tavanı geniş bir pay üstünde uygulanır — her mercek bunu kendi
 * done-check'iyle daha da daraltır (bkz. `doneSetFor`).
 */
async function fetchShortlist(limit: number): Promise<{ shortlist: Signal[]; skipped: number }> {
  const { data, error } = await db
    .from("signals")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit * 20);
  if (error) throw new Error(`signals sorgu hatası: ${error.message}`);
  const window = (data ?? []) as Signal[];

  // Zenginleştirme essay/research dediyse analiz etme — LLM çağrısı boşa gider, kuyruğu kirletir.
  // signal_kind null = legacy satır (sınıf bilinmiyor) → elemeden geçir.
  const scored = window
    .map((s) => {
      const e = StoredEnrichmentSchema.safeParse(s.enrichment);
      const actionable = !e.success || e.data.signal_kind === null || isActionableKind(e.data.signal_kind);
      const score = e.success ? (e.data.triage_score ?? NEUTRAL_TRIAGE_SCORE) : NEUTRAL_TRIAGE_SCORE;
      return { signal: s, actionable, score };
    })
    .filter((x) => x.actionable)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.signal);

  const shortlist = balanceBySource(scored, limit * Math.max(lenses.length, 1), PER_SOURCE_CAP);
  return { shortlist, skipped: window.length - scored.length };
}

/** Belirli bir mercek için, kısa liste içinden hangileri zaten analiz edilmiş. */
async function doneSetFor(lensId: string, signalIds: string[]): Promise<Set<string>> {
  if (FORCE || signalIds.length === 0) return new Set();
  const { data, error } = await db
    .from("analyses")
    .select("signal_id")
    .eq("lens", lensId)
    .in("signal_id", signalIds);
  if (error) throw new Error(`analyses sorgu hatası: ${error.message}`);
  return new Set((data ?? []).map((r) => r.signal_id as string));
}

async function main(): Promise<void> {
  const knowledge = supabaseKnowledgeLayer();
  const thesis = await loadActiveThesis(); // /admin/tez'de kaydedilmiş aktif versiyon, yoksa thesis.config.ts
  const { shortlist, skipped } = await fetchShortlist(BATCH_LIMIT);
  let totalTodo = 0;
  let totalOk = 0;

  for (const lens of lenses) {
    const fewShot = FEW_SHOT_BY_LENS[lens.id] ?? [];
    const done = await doneSetFor(lens.id, shortlist.map((s) => s.id));
    const todo = shortlist.filter((s) => !done.has(s.id)).slice(0, BATCH_LIMIT);
    console.log(
      `[${lens.id}] ${todo.length} sinyal analiz edilecek (provider=${env.provider()}, model=${env.analysisModel()}` +
        `, few-shot=${fewShot.length}, kaynak tavanı=${PER_SOURCE_CAP}${FORCE ? ", FORCE" : ""}` +
        `${skipped > 0 ? `, ${skipped} kovalanamaz sinyal atlandı` : ""})`,
    );

    totalTodo += todo.length;
    let ok = 0;
    for (const signal of todo) {
      try {
        const a = await analyzeSignal(signal, lens, { fewShot, knowledge, thesis }); // mercek-özel çapalar + ekip geçmişi + env provider/model + aktif tez
        const { error } = await db.from("analyses").upsert(
          {
            signal_id: signal.id,
            lens: a.lens,
            fit: a.fit,
            rationale: a.rationale,
            evidence: a.evidence,
            adaptation_notes: lens.extraNote(a),
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
    console.log(`[${lens.id}] bitti: ${ok}/${todo.length} analiz yazıldı`);
    totalOk += ok;
  }

  console.log(`toplam: ${totalOk}/${totalTodo} analiz yazıldı (${lenses.length} mercek)`);

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma — cron kırmızı görsün.
  // Kısmi başarı yeşildir: kalanlar sonraki tick'te otomatik denenir.
  if (totalTodo > 0 && totalOk === 0) {
    throw new Error(`toplu başarısızlık: 0/${totalTodo} analiz yazıldı (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0)) // Vertex/undici keep-alive'ı bekletmesin (cron temiz exit).
  .catch((e) => {
    console.error("analyze başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
