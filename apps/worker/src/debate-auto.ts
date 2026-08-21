import "./env.js"; // repo kökündeki .env'i yükle (runDebate provider'ı process.env'i doğrudan okur)
import { runDebate, type Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { loadActiveThesis } from "./lib/thesis-db.js";
import { selectAutoDebateCandidates, type DecisionLogRow } from "./lib/debate-auto-select.js";

/**
 * Madde 3-A (2026-08-21 kararı): AI Yorumcusu tam otomatik değil, yalnız kullanıcının kişisel
 * "Kovala" kararında tetiklenir (`debate.ts`'in "admin bir kartta tetikler, otomatik/toplu
 * DEĞİL" notuna kısmen sadık — burada admin yerine kullanıcının kararı tetikleyici). Admin
 * panelindeki elle-tetikleme endpoint'i (`/api/admin/debates`) bundan bağımsız yaşamaya devam eder.
 */
const BATCH_LIMIT = Number(process.env["DEBATE_AUTO_LIMIT"] ?? "3"); // 7 LLM çağrısı/tartışma — analiz'den pahalı, tavan düşük
const AUTO_CREATED_BY = "otomatik (kovala kararı)";

async function main(): Promise<void> {
  const { data: decisionRows, error: decErr } = await db
    .from("decisions")
    .select("signal_id, decision, decided_by, created_at")
    .order("created_at", { ascending: false });
  if (decErr) throw new Error(`decisions sorgu hatası: ${decErr.message}`);

  const { data: debateRows, error: debErr } = await db.from("debates").select("signal_id");
  if (debErr) throw new Error(`debates sorgu hatası: ${debErr.message}`);
  const alreadyDebated = new Set((debateRows ?? []).map((r) => r["signal_id"] as string));

  const candidateIds = selectAutoDebateCandidates(
    (decisionRows ?? []) as DecisionLogRow[],
    alreadyDebated,
  ).slice(0, BATCH_LIMIT);

  console.log(
    `[debate-auto] ${candidateIds.length} sinyal için otomatik AI Yorumcusu tetiklenecek ` +
      `(kişisel kovala + henüz tartışılmamış, tavan=${BATCH_LIMIT})`,
  );
  if (candidateIds.length === 0) return;

  const thesis = await loadActiveThesis();
  let ok = 0;
  for (const signalId of candidateIds) {
    const { data: signal, error: sigErr } = await db
      .from("signals")
      .select("*")
      .eq("id", signalId)
      .maybeSingle();
    if (sigErr || !signal) {
      console.error(`[debate-auto] sinyal bulunamadı: ${signalId}`, sigErr?.message);
      continue;
    }

    try {
      const result = await runDebate(signal as Signal, { thesis });
      const { error: insErr } = await db.from("debates").insert({
        signal_id: signalId,
        created_by: AUTO_CREATED_BY,
        transcript: result.transcript,
        final_verdict: result.final_verdict,
        final_commentary: result.final_commentary,
      });
      if (insErr) {
        console.error(`[debate-auto] kayıt hatası (${signalId}):`, insErr.message);
        continue;
      }
      ok++;
      console.log(`[debate-auto] ✓ ${signalId} — nihai karar: ${result.final_verdict}`);
    } catch (e) {
      console.error(`[debate-auto] tartışma başarısız (${signalId}):`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`[debate-auto] bitti: ${ok}/${candidateIds.length} tartışma yazıldı`);

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma — cron kırmızı görsün (analyze.ts deseni).
  if (candidateIds.length > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${candidateIds.length} tartışma yazıldı (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("debate-auto başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
