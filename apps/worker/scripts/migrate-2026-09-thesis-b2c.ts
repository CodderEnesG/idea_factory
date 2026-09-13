import { ARBITRAGE_SEED_LENS, type ThesisConfig } from "@idea-factory/core";
import { db } from "../src/db.js";

/**
 * Tek seferlik migrasyon (2026-09-13): tez v2 (B2C sektörleri + LLM-sarmalayıcı anti-pattern'ı)
 * ve arbitraj merceğinin soru 3/4'ü canlı DB'ye. Kod dosyaları yalnız fallback/seed — canlı
 * değerler `thesis_versions` ve `lenses` tablosunda.
 *
 * Birleştirir, üzerine yazmaz: admin'in /admin/tez'de yaptığı değişiklikler korunur.
 * Idempotent: ikinci koşu "değişiklik yok" der.
 *
 * kullanım: pnpm --filter @idea-factory/worker exec tsx scripts/migrate-2026-09-thesis-b2c.ts [--apply] [--force]
 *   (bayraksız = dry-run, yalnız diff basar)
 */
const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

const ADD_SECTORS = ["B2C tüketici uygulaması (sermaye-hafif)", "marketplace", "creator/topluluk ürünleri"];
const ADD_ANTI_PATTERNS = [
  "İnce LLM sarmalayıcısı — değerin çoğu modelde; model sağlayıcı/platform bunu özellik olarak ekleyebilir (AI kullanmak tek başına sorun değil)",
];

// Soru 3'ün bilinen eski hâlleri: v1 seed + 2026-09-13'ün ilk "tek cümlede" sürümü (canlıya yazılmıştı).
const OLD_Q3S = [
  "Yerel wedge: Türkiye'de somut giriş noktası — hangi dar segment, hangi acı?",
  "Yerel wedge + kitle: Türkiye'de somut giriş noktası ve acı ne, bu ürünü kaç kişi/işletme " +
    "kullanabilir? Giriş segmenti dar olabilir ama ürün o nişe hapsolmuşsa ya da tek cümlede " +
    "anlatılamıyorsa kovala-adayı değildir.",
];
const OLD_Q4 =
  "Uyarlamada ne kırılır: regülasyon / ödeme altyapısı / kültür / dağıtım / ödeme isteği / yerel ikame.";
const NEW_Q3 = ARBITRAGE_SEED_LENS.questions[2]!;
const NEW_Q4 = ARBITRAGE_SEED_LENS.questions[3]!;

function union(base: string[], add: string[]): { merged: string[]; added: string[] } {
  const added = add.filter((x) => !base.includes(x));
  return { merged: [...base, ...added], added };
}

async function migrateThesis(): Promise<void> {
  const { data, error } = await db
    .from("thesis_versions")
    .select("version, config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`thesis_versions okunamadı: ${error.message}`);
  if (!data) {
    console.log("[tez] aktif DB versiyonu yok — worker thesis.config.ts fallback'ini (v2) kullanıyor, yazılacak bir şey yok");
    return;
  }

  const current = data.config as ThesisConfig;
  const sectors = union(current.sectors, ADD_SECTORS);
  const anti = union(current.anti_patterns, ADD_ANTI_PATTERNS);
  if (sectors.added.length === 0 && anti.added.length === 0) {
    console.log(`[tez] aktif ${data.version} zaten güncel — değişiklik yok`);
    return;
  }

  console.log(`[tez] aktif ${data.version} → yeni versiyon:`);
  for (const s of sectors.added) console.log(`  + sektör: ${s}`);
  for (const a of anti.added) console.log(`  + anti-pattern: ${a}`);
  if (!APPLY) return;

  // Versiyon numarası ve pasifle-sonra-ekle sırası api/admin/thesis/route.ts ile aynı.
  const { count, error: countError } = await db
    .from("thesis_versions")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(countError.message);
  const version = `v${(count ?? 0) + 1}`;
  const next: ThesisConfig = { ...current, version, sectors: sectors.merged, anti_patterns: anti.merged };

  const { error: deactivateError } = await db
    .from("thesis_versions")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) throw new Error(deactivateError.message);
  const { error: insertError } = await db
    .from("thesis_versions")
    .insert({ version, config: next, is_active: true, created_by: "migration" });
  if (insertError) throw new Error(insertError.message);
  console.log(`[tez] ✓ ${version} aktif`);
}

async function migrateArbitrageQuestions(): Promise<void> {
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
  if (current.includes(NEW_Q3) && current.includes(NEW_Q4)) {
    console.log("[mercek] arbitraj soruları zaten güncel — değişiklik yok");
    return;
  }

  let next: string[];
  if (current.some((q) => OLD_Q3S.includes(q)) || current.includes(OLD_Q4)) {
    next = current.map((q) => (OLD_Q3S.includes(q) ? NEW_Q3 : q === OLD_Q4 ? NEW_Q4 : q));
  } else if (FORCE) {
    next = [...ARBITRAGE_SEED_LENS.questions];
  } else {
    console.log("[mercek] ⚠ eski soru 3/4 birebir bulunamadı (admin düzenlemiş olabilir) — dokunulmadı.");
    console.log("  mevcut sorular:");
    current.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    console.log("  seed'i tamamen yazmak için --force");
    return;
  }

  console.log("[mercek] arbitraj soru değişikliği:");
  next.forEach((q, i) => {
    if (q !== current[i]) console.log(`  ${i + 1}. - ${current[i] ?? "(yok)"}\n     + ${q}`);
  });
  if (!APPLY) return;

  const { error: updateError } = await db
    .from("lenses")
    .update({ questions: next })
    .eq("lens_id", ARBITRAGE_SEED_LENS.id);
  if (updateError) throw new Error(updateError.message);
  console.log("[mercek] ✓ arbitraj soruları güncellendi");
}

async function main(): Promise<void> {
  console.log(APPLY ? "== APPLY ==" : "== DRY-RUN (yazmak için --apply) ==");
  await migrateThesis();
  await migrateArbitrageQuestions();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("migrate-2026-09 başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
