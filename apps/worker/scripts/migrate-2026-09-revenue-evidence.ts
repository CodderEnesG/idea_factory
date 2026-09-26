import { ARBITRAGE_SEED_LENS } from "@idea-factory/core";
import { db } from "../src/db.js";

/**
 * Tek seferlik migrasyon (2026-09-27): arbitraj merceğinin "Kanıt" sorusuna doğrulanmış gelir
 * ve App Store hasılat sıralaması cümlesi (Kanıtlı gelir listesi). Kod dosyası yalnız seed —
 * canlı sorular `lenses` tablosunda.
 *
 * Yalnız eski soru birebir bulunursa değiştirir; admin düzenlemişse dokunmaz. Idempotent.
 *
 * kullanım: pnpm --filter @idea-factory/worker exec tsx scripts/migrate-2026-09-revenue-evidence.ts [--apply]
 *   (bayraksız = dry-run, yalnız diff basar)
 */
const APPLY = process.argv.includes("--apply");

const OLD_Q2 = "Kanıt: başka pazarda gerçekten işe yaramış mı? (traksiyon/fonlama/büyüme) Yoksa spekülasyon.";
const NEW_Q2 = ARBITRAGE_SEED_LENS.questions[1]!;

async function main(): Promise<void> {
  console.log(APPLY ? "== APPLY ==" : "== DRY-RUN (yazmak için --apply) ==");
  const { data, error } = await db
    .from("lenses")
    .select("questions")
    .eq("lens_id", ARBITRAGE_SEED_LENS.id)
    .maybeSingle();
  if (error) throw new Error(`lenses okunamadı: ${error.message}`);
  if (!data) {
    console.log("[mercek] arbitraj satırı yok — migrate-builtin-lenses.ts yeni seed'le ekler");
    return;
  }

  const current = data.questions as string[];
  if (current.includes(NEW_Q2)) {
    console.log("[mercek] kanıt sorusu zaten güncel — değişiklik yok");
    return;
  }
  if (!current.includes(OLD_Q2)) {
    console.log("[mercek] ⚠ eski kanıt sorusu birebir bulunamadı (admin düzenlemiş olabilir) — dokunulmadı.");
    current.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    return;
  }

  const next = current.map((q) => (q === OLD_Q2 ? NEW_Q2 : q));
  console.log(`[mercek] kanıt sorusu:\n  - ${OLD_Q2}\n  + ${NEW_Q2}`);
  if (!APPLY) return;

  const { error: updateError } = await db
    .from("lenses")
    .update({ questions: next })
    .eq("lens_id", ARBITRAGE_SEED_LENS.id);
  if (updateError) throw new Error(updateError.message);
  console.log("[mercek] ✓ arbitraj kanıt sorusu güncellendi");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("migrate-2026-09-revenue-evidence başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
