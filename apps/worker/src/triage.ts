import {
  isActionableKind,
  StoredEnrichmentSchema,
  triageSignal,
  type Signal,
  type StoredEnrichment,
} from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";

const LIMIT = Number(process.env["TRIAGE_LIMIT"] ?? "40");
// signals.enrichment jsonb'de triage_score kolon değil — PostgREST'te doğrudan filtrelenemez,
// analyze.ts'in fetchUnanalyzed'ı gibi geniş bir pencere çekip istemci tarafında süzüyoruz.
const WINDOW_MULT = 5;
const FORCE = process.env["TRIAGE_FORCE"] === "true";

async function fetchToTriage(limit: number): Promise<{ signal: Signal; enrichment: StoredEnrichment }[]> {
  const { data, error } = await db
    .from("signals")
    .select("*")
    .not("enriched_at", "is", null)
    .order("fetched_at", { ascending: false })
    .limit(limit * WINDOW_MULT);
  if (error) throw new Error(`DB sorgu hatası: ${error.message}`);

  const out: { signal: Signal; enrichment: StoredEnrichment }[] = [];
  for (const row of (data ?? []) as Signal[]) {
    const parsed = StoredEnrichmentSchema.safeParse(row.enrichment);
    // Şema hiç geçmiyorsa dokunma — merge-patch ham jsonb'yi ezerdi (bkz. handle()). enrich.ts
    // zaten geçerli bir şekil yazar; buraya düşmesi enrich.ts/şema uyuşmazlığı demektir, ayrı sorun.
    if (!parsed.success) continue;
    const enrichment = parsed.data;
    if (!FORCE && enrichment.triage_score != null) continue; // zaten triage edilmiş
    // essay/research zaten analiz edilmeyecek — triage'a da harcanmasın.
    if (enrichment.signal_kind && !isActionableKind(enrichment.signal_kind)) continue;
    out.push({ signal: row, enrichment });
    if (out.length >= limit) break;
  }
  return out;
}

async function handle(signal: Signal, enrichment: StoredEnrichment): Promise<boolean> {
  try {
    const result = await triageSignal(signal, enrichment);
    const patch = { enrichment: { ...enrichment, triage_score: result.score, triage_reason: result.reason } };
    const { error } = await db.from("signals").update(patch).eq("id", signal.id);
    if (error) throw new Error(error.message);
    console.log(`  ✓ skor ${result.score} — ${result.reason.slice(0, 60)} — ${signal.title.slice(0, 50)}`);
    return true;
  } catch (e) {
    // LLM/DB hatası → triage_score null kalır, sonraki tick otomatik yeniden dener.
    console.error(`  ✗ ${signal.url}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

async function main(): Promise<void> {
  const todo = await fetchToTriage(LIMIT);
  console.log(`${todo.length} sinyal ön-elenecek (model=${env.analysisModel()}${FORCE ? ", FORCE" : ""})`);

  let ok = 0;
  for (const { signal, enrichment } of todo) {
    if (await handle(signal, enrichment)) ok++;
  }
  console.log(`bitti: ${ok}/${todo.length} ön-elendi`);

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma — cron kırmızı görsün.
  if (todo.length > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${todo.length} ön-elendi (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0)) // undici keep-alive bekletmesin (cron temiz exit)
  .catch((e) => {
    console.error("triage başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
