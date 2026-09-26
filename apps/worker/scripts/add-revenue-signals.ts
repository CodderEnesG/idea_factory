import { readFileSync } from "node:fs";
import { z } from "zod";
import { db } from "../src/db.js";
import { RevenueRecordSchema, revenueRecordToSignal } from "../src/lib/revenue-signal.js";

/**
 * Elle gelir kanıtlı sinyal ekler (Kanıtlı gelir listesi) — kayıt formatı `src/lib/revenue-signal.ts`.
 * Var olan URL atlanır; eklenen satırlar sonraki tick'te zenginleştirilip analiz edilir.
 *
 * Veri dosyası repoya konmaz (repo public; kaynağın gelir rakamları yeniden yayımlanmasın).
 *
 * kullanım: pnpm --filter @idea-factory/worker exec tsx scripts/add-revenue-signals.ts <kayıtlar.json> [--apply]
 *   (bayraksız = dry-run, yalnız ne ekleneceğini basar)
 */
const APPLY = process.argv.includes("--apply");
const file = process.argv.slice(2).find((a) => !a.startsWith("--"));

async function main(): Promise<void> {
  if (!file) throw new Error("kayıt dosyası verilmedi");
  const records = z.array(RevenueRecordSchema).parse(JSON.parse(readFileSync(file, "utf8")));
  const capturedAt = new Date().toISOString();
  const signals = records.map((r) => revenueRecordToSignal(r, capturedAt));

  const { data, error } = await db.from("signals").select("url").in("url", signals.map((s) => s.url));
  if (error) throw new Error(`signals sorgu hatası: ${error.message}`);
  const existing = new Set((data ?? []).map((r) => r.url as string));
  const fresh = signals.filter((s) => !existing.has(s.url));

  for (const s of signals) {
    console.log(`${existing.has(s.url) ? "atla (var)" : "ekle      "}  ${s.title.padEnd(28)} ${s.url}`);
  }
  console.log(`\n${records.length} kayıt → ${fresh.length} yeni, ${signals.length - fresh.length} zaten var`);

  if (!APPLY) {
    console.log("dry-run — yazmak için --apply");
    return;
  }
  if (fresh.length === 0) return;
  const { error: insErr } = await db.from("signals").insert(fresh);
  if (insErr) throw new Error(`insert hatası: ${insErr.message}`);
  console.log(`✓ ${fresh.length} sinyal eklendi`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("add-revenue-signals başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
