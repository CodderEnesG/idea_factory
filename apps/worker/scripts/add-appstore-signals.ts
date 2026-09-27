import { db } from "../src/db.js";
import { appstoreGrossing } from "../src/sources/appstore.js";

/**
 * App Store hasılat kaynağını (`appstore_grossing`) toplama ayarında açmadan tek seferlik çeker
 * (Kanıtlı gelir listesi, 2026-09-27). Var olan URL atlanır; eklenenler sonraki tick'te
 * zenginleştirilip analiz edilir. Kalıcı akış için kaynağı /admin/toplama'dan aç.
 *
 * kullanım: pnpm --filter @idea-factory/worker exec tsx scripts/add-appstore-signals.ts [--apply]
 *   (bayraksız = dry-run)
 */
const APPLY = process.argv.includes("--apply");
const CHUNK = 40; // PostgREST .in() URL uzunluğu (ingest.ts EXISTING_CHUNK ile aynı gerekçe)

async function main(): Promise<void> {
  const signals = await appstoreGrossing.fetch();
  const existing = new Set<string>();
  for (let i = 0; i < signals.length; i += CHUNK) {
    const urls = signals.slice(i, i + CHUNK).map((s) => s.url);
    const { data, error } = await db.from("signals").select("url").in("url", urls);
    if (error) throw new Error(`signals sorgu hatası: ${error.message}`);
    for (const r of data ?? []) existing.add(r.url as string);
  }
  const fresh = signals.filter((s) => !existing.has(s.url));
  console.log(`${signals.length} uygulama → ${fresh.length} yeni, ${existing.size} zaten var`);
  if (!APPLY) {
    console.log("dry-run — yazmak için --apply");
    return;
  }
  for (let i = 0; i < fresh.length; i += 200) {
    const { error } = await db.from("signals").insert(fresh.slice(i, i + 200));
    if (error) throw new Error(`insert hatası: ${error.message}`);
  }
  console.log(`✓ ${fresh.length} sinyal eklendi`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("add-appstore-signals başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
