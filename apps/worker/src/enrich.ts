import { parse } from "node-html-parser";
import {
  enrichSignal,
  SignalSchema,
  type Signal,
  type StoredEnrichment,
} from "@idea-factory/core";
import { db } from "./db.js";
import { env } from "./env.js";

const LIMIT = Number(process.env["ENRICH_LIMIT"] ?? "25");
const CONCURRENCY = Number(process.env["ENRICH_CONCURRENCY"] ?? "2");
const MAX_CHARS = Number(process.env["ENRICH_MAX_CHARS"] ?? "18000");
const FETCH_TIMEOUT_MS = Number(process.env["ENRICH_FETCH_TIMEOUT_MS"] ?? "15000");
const FORCE = process.env["FORCE_ENRICH"] === "true";

const UA = "Mozilla/5.0 (compatible; IdeaFactory/1.0)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sayfa metnini çek: timeout, UA, yalnız text/html; her hata → null (asla throw). */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    const root = parse(await res.text());
    for (const sel of ["script", "style", "noscript", "svg", "iframe"]) {
      root.querySelectorAll(sel).forEach((n) => n.remove());
    }
    const text = root.text.replace(/\s+/g, " ").trim();
    return text.length > 0 ? text.slice(0, MAX_CHARS) : null;
  } catch {
    return null;
  }
}

async function fetchToEnrich(limit: number): Promise<Signal[]> {
  let q = db.from("signals").select("*").order("fetched_at", { ascending: false }).limit(limit);
  if (!FORCE) q = q.is("enriched_at", null);
  const { data, error } = await q;
  if (error) throw new Error(`DB sorgu hatası: ${error.message}`);
  return (data ?? []).map((r) => SignalSchema.parse(r));
}

async function handle(signal: Signal): Promise<boolean> {
  try {
    const text = await fetchPageText(signal.url);
    const extraction = await enrichSignal(signal, text);
    const stored: StoredEnrichment = {
      ...extraction,
      fetch_ok: text !== null,
      model: env.analysisModel(),
      page_chars: text?.length ?? null,
    };
    const patch: Record<string, unknown> = {
      enrichment: stored,
      enriched_at: new Date().toISOString(),
    };
    // market/sector boşsa extraction'dan backfill.
    if (!signal.market && extraction.market) patch["market"] = extraction.market;
    if (!signal.sector && extraction.sector) patch["sector"] = extraction.sector;

    const { error } = await db.from("signals").update(patch).eq("id", signal.id);
    if (error) throw new Error(error.message);
    console.log(
      `  ✓ ${text ? `${text.length}ch` : "sayfa yok"} · ${extraction.hq_country ?? "?"} — ${signal.title.slice(0, 55)}`,
    );
    return true;
  } catch (e) {
    // LLM/DB hatası → enriched_at null kalır, sonraki tick otomatik yeniden dener.
    console.error(`  ✗ ${signal.url}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

async function main(): Promise<void> {
  const todo = await fetchToEnrich(LIMIT);
  console.log(
    `${todo.length} sinyal zenginleştirilecek (model=${env.analysisModel()}, concurrency=${CONCURRENCY}${FORCE ? ", FORCE" : ""})`,
  );

  let ok = 0;
  let i = 0;
  async function workerLoop(): Promise<void> {
    for (;;) {
      const n = i++;
      if (n >= todo.length) return;
      if (n >= CONCURRENCY) await sleep(300); // Vertex burst 429 önlemi
      if (await handle(todo[n]!)) ok++;
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
