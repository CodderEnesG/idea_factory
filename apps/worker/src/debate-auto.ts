import "./env.js"; // repo kökündeki .env'i yükle (runDebate provider'ı process.env'i doğrudan okur)
import { composite, runDebate, type BaseAnalysis, type Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { loadActiveThesis } from "./lib/thesis-db.js";
import { loadActiveCustomLenses } from "./lib/lenses-db.js";
import {
  GATE_REQUIRED_DEBATES,
  selectAutoDebateCandidates,
  selectGateCandidates,
  type DecisionLogRow,
  type GateCandidateRow,
} from "./lib/debate-auto-select.js";

/**
 * **Yorumcu kapısı** (FAZ6_PLAN.md §Faz 2). AI Yorumcusu artık kararın ARKASINDA değil
 * ÖNÜNDE: kompozit bandı `pursue` olan her sinyal, insan görmeden İKİ bağımsız tartışmadan
 * geçer. Herhangi biri "ele" derse kart kovala rozetini alamaz.
 *
 * Ölçüm (2026-08-25): fit>=80 tek başına %22 kesinlik, "+ yorumcu ele demedi" %53.
 * Çift tur, tartışmanın kendi test-retest tutarlılığı %67 olduğu için.
 *
 * İkinci tetikleyici korunuyor: bir insan fit<80 bir sinyale "Kovala" dediyse orada da
 * ikinci görüş değerli (kapı onu hiç seçmez).
 *
 * Tick sırası DEĞİŞMİYOR — `package.json` zaten `analyze && debate-auto && digest` koşuyor,
 * yani tick N'de analiz edilen sinyal tick N'de kapıdan geçer. Bunu "düzeltmeye" kalkma.
 */
const BATCH_LIMIT = Number(process.env["DEBATE_AUTO_LIMIT"] ?? "8"); // TUR tavanı (sinyal değil)
const AUTO_CREATED_BY = "otomatik (Yorumcu kapısı)";

/** Sinyal başına analizleri toplayıp kompozit bandı hesapla. */
async function loadGateCandidates(): Promise<GateCandidateRow[]> {
  const lensRegistry = await loadActiveCustomLenses();
  const { data, error } = await db
    .from("analyses")
    .select("signal_id, lens, fit, confidence, recommended_action, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`analyses sorgu hatası: ${error.message}`);

  const bySignal = new Map<string, { analyses: Record<string, BaseAnalysis>; ts: string }>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const signalId = row["signal_id"] as string;
    const lens = row["lens"] as string;
    const entry = bySignal.get(signalId) ?? { analyses: {}, ts: row["created_at"] as string };
    // composite() yalnız fit/confidence/lens okur; diğer alanlar bu sorguda gereksiz.
    entry.analyses[lens] = row as unknown as BaseAnalysis;
    bySignal.set(signalId, entry);
  }

  const out: GateCandidateRow[] = [];
  for (const [signalId, entry] of bySignal) {
    const comp = composite(entry.analyses, lensRegistry);
    out.push({ signal_id: signalId, band: comp.band, fit: comp.fit, ts: entry.ts });
  }
  return out;
}

async function main(): Promise<void> {
  // Kapı turları: sinyal başına kaç OTOMATİK tartışma var (manuel turlar kapıyı kapatmaz).
  let debRes = (await db.from("debates").select("signal_id, kind")) as {
    data: { signal_id: string; kind?: string }[] | null;
    error: { code?: string; message: string } | null;
  };
  // 0014 uygulanmadıysa `kind` yok — kapı kapanamaz. Sessizce yanlış çalışmaktansa AÇIKÇA dur:
  // her sinyal 2 tur ister ama hiçbiri "auto" sayılamaz, yani sonsuz tartışma üretirdik.
  if (debRes.error?.code === "42703") {
    throw new Error(
      "0014_debate_gate.sql uygulanmamış (debates.kind yok) — Yorumcu kapısı çalışamaz. " +
        "Supabase Dashboard → SQL Editor'dan migration'ı uygula.",
    );
  }
  const { data: debateRows, error: debErr } = debRes;
  if (debErr) throw new Error(`debates sorgu hatası: ${debErr.message}`);
  const autoCount = new Map<string, number>();
  const anyDebate = new Set<string>();
  for (const r of debateRows ?? []) {
    anyDebate.add(r.signal_id);
    if (r.kind === "auto") autoCount.set(r.signal_id, (autoCount.get(r.signal_id) ?? 0) + 1);
  }

  const gateRows = await loadGateCandidates();
  const gateIds = selectGateCandidates(gateRows, autoCount);

  // İkincil: insan "kovala" demiş ama kapı kapsamına girmeyen sinyaller.
  const { data: decisionRows, error: decErr } = await db
    .from("decisions")
    .select("signal_id, decision, decided_by, created_at")
    .order("created_at", { ascending: false });
  if (decErr) throw new Error(`decisions sorgu hatası: ${decErr.message}`);
  const humanIds = selectAutoDebateCandidates(
    (decisionRows ?? []) as DecisionLogRow[],
    anyDebate,
  ).filter((id) => !gateIds.includes(id));

  // Aday başına kaç tur eksik — kapı adaylarında 2'ye tamamla, insan-tetiklilerde 1 tur yeter.
  const plan: { signalId: string; runNo: number }[] = [];
  for (const id of gateIds) {
    const have = autoCount.get(id) ?? 0;
    for (let n = have + 1; n <= GATE_REQUIRED_DEBATES; n++) plan.push({ signalId: id, runNo: n });
  }
  for (const id of humanIds) plan.push({ signalId: id, runNo: (autoCount.get(id) ?? 0) + 1 });
  // Kemer + askı: `humanIds` zaten `gateIds`ten arındırılmış (yukarıda) ama aynı (sinyal, tur)
  // çiftini iki kez koşturmak boşa 7 LLM çağrısı demek — tek kaynak yerine burada da kes.
  const seenPlan = new Set<string>();
  const deduped = plan.filter((p) => {
    const k = `${p.signalId}#${p.runNo}`;
    if (seenPlan.has(k)) return false;
    seenPlan.add(k);
    return true;
  });

  const pendingSignals = gateIds.length;
  const todo = deduped.slice(0, BATCH_LIMIT);

  console.log(
    `[debate-auto] kapı kuyruğu: ${pendingSignals} sinyal bekliyor · ${deduped.length} tur gerekli · ` +
      `bu koşuda ${todo.length} tur (tavan=${BATCH_LIMIT}, insan-tetikli ${humanIds.length} sinyal dahil)`,
  );
  if (todo.length === 0) return;

  const thesis = await loadActiveThesis();
  let ok = 0;
  let duplicates = 0;
  for (const { signalId, runNo } of todo) {
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
        created_by: `${AUTO_CREATED_BY} #${runNo}`,
        transcript: result.transcript,
        final_verdict: result.final_verdict,
        final_commentary: result.final_commentary,
        kind: "auto",
        run_no: runNo,
      });
      if (insErr) {
        // 23505 = unique ihlali (0014: debates_auto_run). Eşzamanlı bir tick aynı turu zaten
        // yazmış demektir — bu İYİ HUYLU bir çakışma, toplu-başarısızlık guard'ını tetiklememeli.
        if (insErr.code === "23505") {
          duplicates++;
          console.log(`[debate-auto] ~ ${signalId} tur ${runNo} zaten yazılmış (eşzamanlı koşu), atlandı`);
          continue;
        }
        console.error(`[debate-auto] kayıt hatası (${signalId}):`, insErr.message);
        continue;
      }
      ok++;
      console.log(`[debate-auto] ✓ ${signalId} tur ${runNo} — nihai karar: ${result.final_verdict}`);
    } catch (e) {
      console.error(`[debate-auto] tartışma başarısız (${signalId}):`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`[debate-auto] bitti: ${ok}/${todo.length} tur yazıldı${duplicates ? ` (${duplicates} mükerrer atlandı)` : ""}`);

  // Hepsi patladıysa (kota/anahtar/ağ) sessiz yeşil kalma — cron kırmızı görsün (analyze.ts deseni).
  // Mükerrer atlamalar başarısızlık değil, o yüzden paydadan düşülüyor.
  const attempted = todo.length - duplicates;
  if (attempted > 0 && ok === 0) {
    throw new Error(`toplu başarısızlık: 0/${attempted} tartışma yazıldı (kota/anahtar kontrol et)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("debate-auto başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
