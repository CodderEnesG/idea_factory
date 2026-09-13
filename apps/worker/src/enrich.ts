import { SignalSchema, type Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";
import { enrichOne } from "./lib/enrich-one.js";
import { loadActiveThesis } from "./lib/thesis-db.js";

const LIMIT = Number(process.env["ENRICH_LIMIT"] ?? "25");
const CONCURRENCY = Number(process.env["ENRICH_CONCURRENCY"] ?? "2");
const FORCE = process.env["FORCE_ENRICH"] === "true";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchToEnrich(limit: number): Promise<{ signal: Signal; prev: unknown }[]> {
  let q = db.from("signals").select("*").order("fetched_at", { ascending: false }).limit(limit);
  if (!FORCE) q = q.is("enriched_at", null);
  const { data, error } = await q;
  if (error) throw new Error(`DB sorgu hatası: ${error.message}`);
  return (data ?? []).map((r) => ({ signal: SignalSchema.parse(r), prev: r.enrichment }));
}

async function main(): Promise<void> {
  // Sektör listesi aktif tezden gelmeli — /admin/tez'de değişen sektörler fallback dosyada yok.
  const thesis = await loadActiveThesis();
  const todo = await fetchToEnrich(LIMIT);
  console.log(
    `${todo.length} sinyal zenginleştirilecek (model=${env.analysisModel()}, tez=${thesis.version}, concurrency=${CONCURRENCY}${FORCE ? ", FORCE" : ""})`,
  );

  let ok = 0;
  let i = 0;
  async function workerLoop(): Promise<void> {
    for (;;) {
      const n = i++;
      if (n >= todo.length) return;
      if (n >= CONCURRENCY) await sleep(300); // Vertex burst 429 önlemi
      const item = todo[n]!;
      if (await enrichOne(item.signal, item.prev, thesis)) ok++;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, workerLoop));

  console.log(`bitti: ${ok}/${todo.length} zenginleştirildi`);

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma — cron kırmızı görsün.
  // Kısmi başarı yeşildir: kalanlar sonraki tick'te otomatik denenir.
  if (todo.length > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${todo.length} zenginleştirildi (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0)) // undici keep-alive bekletmesin (cron temiz exit)
  .catch((e) => {
    console.error("enrich başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
