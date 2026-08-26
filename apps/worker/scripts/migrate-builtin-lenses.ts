import { ARBITRAGE_SEED_LENS, WHITE_SPACE_SEED_LENS, type CustomLensDef } from "@idea-factory/core";
import { db } from "../src/db.js";

/**
 * Tek seferlik migrasyon (2026-08-15): arbitraj/beyaz-alan artık hardcoded builtin değil,
 * `lenses` tablosunda sıradan bir satır (bkz. packages/core/lenses.config.ts alt notu).
 * Idempotent — satır zaten varsa dokunmaz. lens_id'ler SEED sabitlerinden gelir ve
 * DEĞİŞTİRİLMEMELİ (geçmiş `analyses` satırları ve golden few-shot seti buna bağlı).
 *
 * kullanım: pnpm --filter @idea-factory/worker exec tsx scripts/migrate-builtin-lenses.ts
 */
async function seedIfMissing(def: CustomLensDef): Promise<void> {
  const { data } = await db.from("lenses").select("lens_id").eq("lens_id", def.id).maybeSingle();
  if (data) {
    console.log(`[migrate-lenses] "${def.id}" zaten var — atlandı`);
    return;
  }
  const { error } = await db.from("lenses").insert({
    lens_id: def.id,
    name: def.name,
    weight: def.weight,
    extra_note_label: def.extraNoteLabel,
    grounding: def.grounding ?? false,
    questions: def.questions,
    active: true,
    created_by: "migration",
  });
  if (error) throw new Error(`"${def.id}" eklenemedi: ${error.message}`);
  console.log(`[migrate-lenses] ✓ "${def.id}" eklendi (weight=${def.weight})`);
}

async function main(): Promise<void> {
  await seedIfMissing(ARBITRAGE_SEED_LENS);
  await seedIfMissing(WHITE_SPACE_SEED_LENS);
}

main().catch((e) => {
  console.error("migrate-lenses başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
