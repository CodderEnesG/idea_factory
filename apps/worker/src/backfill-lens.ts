import {
  ARBITRAGE_SEED_LENS,
  golden,
  lenses,
  type FewShotExample,
  type Lens,
  type Signal,
} from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";
import { analyzeOne } from "./lib/analyze-one.js";
import { supabaseKnowledgeLayer } from "./lib/knowledge-db.js";
import { loadActiveCustomLenses } from "./lib/lenses-db.js";
import { loadActiveThesis } from "./lib/thesis-db.js";
import { selectCandidates, type Candidate } from "./lib/backfill-select.js";
import { loadSourceWeights } from "./lib/source-weight.js";

/**
 * Geçmişe dönük mercek doldurma. `analyze.ts` yalnız EN YENİ pencereyi çeker
 * (`fetchShortlist`: `limit * 20` satır) — bir mercek sonradan eklendiğinde eski sinyaller o
 * pencereye bir daha asla girmez. Beyaz-alan merceği 2026-08-07'de eklendiğinde tam bu oldu:
 * arbitraj 873 analiz, beyaz-alan 74 → kompozit sıralama kartların %92'sinde tek-mercekliydi.
 *
 * Bu script tabloyu SAYFA SAYFA tarar (yeni-pencere değil), eksikleri bulur, tavanlı işler.
 * Resumable: "yapılmışlar" her koşuda yeniden hesaplanır, tekrar çalıştırmak kaldığı yerden
 * devam eder; cron aynı anda koşsa bile `analyze.ts` ile aynı `onConflict` upsert'i kullanır.
 */
// CLI argüman env değişkeninden önce gelir — `tick` script'i kaynak-bağımsız (cross-env'siz)
// iki merceği ard arda çağırabilsin diye: `tsx backfill-lens.ts arbitrage`.
const LENS_ID = process.argv[2] ?? process.env["BACKFILL_LENS"] ?? "white_space";
// Koşu başı tavan bilinçli düşük: 800+ sinyallik backfill'i kademeli harca, aradaki çıktıyı gör.
// 2026-09-04'ten beri `tick`'in kendisi (2x/gün, otomatik) her iki merceği de çağırıyor —
// tavan artık yalnız tek seferlik manuel koşuyu değil, GÖZETİMSİZ günlük maliyeti de sınırlıyor.
const MAX = Number(process.env["BACKFILL_MAX"] ?? "15");
const DRY = process.env["BACKFILL_DRY"] === "true";
// Tek analiz dakikalar sürüyor (ağır şema + guard retry) — 840 sinyal sıralı ≈ günler.
// Çağrılar I/O-bağlı, paralelleşir. AMA Vertex kotası dar: 5 paralelde 429 RESOURCE_EXHAUSTED
// görüldü (2026-08-10 pilotu), o yüzden varsayılan 3. 1 = tamamen sıralı.
const CONCURRENCY = Math.max(1, Number(process.env["BACKFILL_CONCURRENCY"] ?? "3"));
const PAGE = 1000; // PostgREST satır tavanı

const FEW_SHOT_BY_LENS: Record<string, FewShotExample[]> = { [ARBITRAGE_SEED_LENS.id]: golden };

async function resolveLens(id: string): Promise<Lens> {
  const all = [...lenses, ...(await loadActiveCustomLenses())];
  const lens = all.find((l) => l.id === id);
  if (!lens) {
    throw new Error(`bilinmeyen mercek: "${id}" (mevcut: ${all.map((l) => l.id).join(", ")})`);
  }
  return lens;
}

/** Bu mercekte zaten analizi olan sinyal id'leri (sayfalı — 1000 satır tavanını aşar). */
async function doneSet(lensId: string): Promise<Set<string>> {
  const done = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("analyses")
      .select("signal_id")
      .eq("lens", lensId)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`analyses sorgu hatası: ${error.message}`);
    const rows = data ?? [];
    for (const r of rows) done.add(r.signal_id as string);
    if (rows.length < PAGE) return done;
  }
}

/** Tüm sinyalleri sayfa sayfa tara (yeni-pencere DEĞİL); eleme+sıralama `selectCandidates`'ta. */
async function findCandidates(
  done: Set<string>,
  sourceWeights: Map<string, number>,
): Promise<{ candidates: Candidate[]; scanned: number }> {
  const all: Signal[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("signals")
      .select("*")
      .order("fetched_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`signals sorgu hatası: ${error.message}`);
    const rows = (data ?? []) as Signal[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }

  return { candidates: selectCandidates(all, done, sourceWeights), scanned: all.length };
}

async function main(): Promise<void> {
  const lens = await resolveLens(LENS_ID);
  const done = await doneSet(lens.id);
  // Kıt LLM bütçesini kaynağın tarihsel fit≥80 oranına göre önceliklendir (bkz. source-weight.ts).
  const sourceWeights = await loadSourceWeights();
  const { candidates, scanned } = await findCandidates(done, sourceWeights);

  console.log(
    `[${lens.id}] ${scanned} sinyal tarandı → ${done.size} zaten analizli, ` +
      `${candidates.length} aday (kovalanabilir + bu mercekte analizsiz)`,
  );

  if (DRY) {
    console.log("BACKFILL_DRY=true — LLM çağrılmadı, yalnız sayım.");
    return;
  }

  const todo = candidates.slice(0, MAX);
  const fewShot = FEW_SHOT_BY_LENS[lens.id] ?? [];
  console.log(
    `[${lens.id}] ${todo.length} sinyal analiz edilecek (provider=${env.provider()}, ` +
      `model=${env.analysisModel()}, few-shot=${fewShot.length}, tavan=${MAX}, ` +
      `paralel=${CONCURRENCY})`,
  );

  const knowledge = supabaseKnowledgeLayer();
  const thesis = await loadActiveThesis();

  // Sabit boyutlu havuz: her worker sıradaki sinyali kapar. `analyzeOne` hatayı zaten yutuyor,
  // yani bir worker'ın patlaması diğerlerini düşürmez; yazılmayan satır sonraki koşuda döner.
  let ok = 0;
  let next = 0;
  let doneCount = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      if (i >= todo.length) return;
      const item = todo[i];
      if (!item) return;
      if (await analyzeOne(item.signal, lens, { fewShot, knowledge, thesis })) ok++;
      doneCount++;
      if (doneCount % 10 === 0) console.log(`  … ${doneCount}/${todo.length}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

  const remaining = candidates.length - ok;
  console.log(
    `[${lens.id}] bitti: ${ok}/${todo.length} analiz yazıldı — ${remaining} aday kaldı` +
      (remaining > 0 ? ` (~${Math.ceil(remaining / Math.max(MAX, 1))} koşu daha)` : " ✅"),
  );

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma.
  if (todo.length > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${todo.length} analiz yazıldı (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0)) // Vertex/undici keep-alive'ı bekletmesin
  .catch((e) => {
    console.error("backfill başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
