import type { Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { productHunt } from "./sources/producthunt.js";
import { tldr } from "./sources/tldr.js";
import type { Source } from "./sources/types.js";

const SOURCES: Source[] = [productHunt, tldr];

/** Batch içi dedup: url + content_hash üzerinden ilk görüleni tut. */
function dedupeBatch(signals: Signal[]): Signal[] {
  const seenUrl = new Set<string>();
  const seenHash = new Set<string>();
  const out: Signal[] = [];
  for (const s of signals) {
    if (seenUrl.has(s.url) || seenHash.has(s.content_hash)) continue;
    seenUrl.add(s.url);
    seenHash.add(s.content_hash);
    out.push(s);
  }
  return out;
}

/** DB'de zaten olanları (url veya content_hash) ele — idempotent. */
async function filterExisting(signals: Signal[]): Promise<Signal[]> {
  if (signals.length === 0) return [];
  const urls = signals.map((s) => s.url);
  const hashes = signals.map((s) => s.content_hash);

  const { data, error } = await db
    .from("signals")
    .select("url, content_hash")
    .or(`url.in.(${urls.map(quote).join(",")}),content_hash.in.(${hashes.map(quote).join(",")})`);
  if (error) throw new Error(`DB sorgu hatası: ${error.message}`);

  const existingUrl = new Set((data ?? []).map((r) => r.url));
  const existingHash = new Set((data ?? []).map((r) => r.content_hash));
  return signals.filter((s) => !existingUrl.has(s.url) && !existingHash.has(s.content_hash));
}

// PostgREST .or() filtresi için değer kaçışı (virgül/parantez içeren url'ler).
function quote(v: string): string {
  return `"${v.replace(/"/g, '\\"')}"`;
}

async function main(): Promise<void> {
  let collected: Signal[] = [];
  for (const src of SOURCES) {
    try {
      const rows = await src.fetch();
      console.log(`[${src.name}] ${rows.length} sinyal çekildi`);
      collected = collected.concat(rows);
    } catch (e) {
      console.error(`[${src.name}] çekim hatası:`, e instanceof Error ? e.message : e);
    }
  }

  const deduped = dedupeBatch(collected);
  const fresh = await filterExisting(deduped);
  console.log(`toplam ${collected.length} → batch-dedup ${deduped.length} → yeni ${fresh.length}`);

  if (fresh.length > 0) {
    const { error } = await db.from("signals").insert(fresh);
    if (error) throw new Error(`Insert hatası: ${error.message}`);
    console.log(`✓ ${fresh.length} yeni sinyal eklendi`);
  } else {
    console.log("yeni sinyal yok (idempotent)");
  }
}

main().catch((e) => {
  console.error("ingest başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
