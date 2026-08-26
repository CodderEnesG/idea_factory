/**
 * Kalibrasyon ölçümü — canlı Supabase'e karşı, YALNIZ OKUMA.
 *
 * 2026-08-25'te elle çekilen sorguların tekrarlanabilir hâli (FAZ6_PLAN.md §Doğrulama).
 * Yorumcu kapısının ve beyaz-alan grounding'inin işe yarayıp yaramadığı ancak bu sayılar
 * tekrar tekrar bakılarak görülür; tek seferlik bir scratchpad script'i olarak bırakmak
 * ölçümü kaybetmek demekti.
 *
 * Çalıştır:  pnpm --filter @idea-factory/core calibration
 * Gerekli:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (repo kökündeki .env.local'den okunur)
 *
 * ── TABAN DEĞERLER (2026-08-25, kapı ve grounding devreye girmeden ÖNCE) ──
 *   kovala kesinliği (fit>=80)          %22   (17/79 · 36'sı ELE edildi)
 *   + yorumcu "ele" demedi              %53   (8/15)
 *   ham AI ↔ insan tam uyum             %25   (39/155)
 *   yorumcu ↔ insan tam uyum            %60   (91/152)
 *   yorumcu test-retest tutarlılığı     %67   (18/27 mükerrer tartışma aynı sonuç)
 *   tartışma verdict karışımı           3 kovala / 62 izle / 195 ele
 *   beyaz-alan confidence:low           %66   (434/662)
 *   beyaz-alan ↔ arbitraj korelasyonu   r=0.01
 *   ws>=60 → insan-kovala               %40 (n=10)  ·  ws<60 → %7 (n=28)
 */

type Band = "pursue" | "watch" | "kill";

const TR: Record<Band, string> = { pursue: "kovala", watch: "izle", kill: "ele" };
const GATE_REQUIRED = 2;

interface AnalysisRow {
  signal_id: string;
  lens: string;
  fit: number;
  confidence: string;
  created_at: string;
}
interface DecisionRow {
  signal_id: string;
  decision: Band;
  decided_by: string | null;
  created_at: string;
}
interface DebateRow {
  signal_id: string;
  final_verdict: Band;
  created_at: string;
  kind?: string | null;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} gerekli (repo kökündeki .env.local'e ekle)`);
  return v;
}

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const url = env("SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const out: T[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=${PAGE}&offset=${offset}`, {
      headers,
    });
    if (!res.ok) throw new Error(`${table} sorgusu başarısız: ${res.status} ${await res.text()}`);
    const page = (await res.json()) as T[];
    out.push(...page);
    if (page.length < PAGE) return out;
  }
}

function pct(n: number, d: number): string {
  return d === 0 ? "—" : `%${Math.round((n / d) * 100)} (${n}/${d})`;
}

/** Kapı: 2 otomatik tur gerekli; biri "ele" derse veto, en az biri "kovala" ise onaylı. */
function gateOf(aiBand: Band, autoVerdicts: Band[]): { band: Band; gate: string } {
  if (aiBand !== "pursue") return { band: aiBand, gate: "n/a" };
  if (autoVerdicts.length < GATE_REQUIRED) return { band: "watch", gate: "pending" };
  if (autoVerdicts.includes("kill")) return { band: "kill", gate: "vetoed" };
  if (autoVerdicts.includes("pursue")) return { band: "pursue", gate: "confirmed" };
  return { band: "pursue", gate: "caveat" };
}

async function main(): Promise<void> {
  const [analyses, decisions, debates] = await Promise.all([
    fetchAll<AnalysisRow>("analyses", "signal_id,lens,fit,confidence,created_at"),
    fetchAll<DecisionRow>("decisions", "signal_id,decision,decided_by,created_at"),
    // 0014 henüz uygulanmamışsa `kind` yok — o durumda tüm turlar "auto" sayılır (eski
    // otomatik seçim de zaten `created_by like 'otomatik%'` idi), ölçüm yine anlamlı kalır.
    fetchAll<DebateRow>("debates", "signal_id,final_verdict,created_at,kind").catch(async (e) => {
      if (!/does not exist/.test(String(e))) throw e;
      console.warn("(0014 uygulanmamış — `kind` olmadan ölçülüyor, tüm turlar kapı turu sayılıyor)");
      return fetchAll<DebateRow>("debates", "signal_id,final_verdict,created_at");
    }),
  ]);

  const arb = new Map<string, AnalysisRow>();
  const ws = new Map<string, AnalysisRow>();
  for (const a of analyses) {
    if (a.lens === "arbitrage") arb.set(a.signal_id, a);
    else if (a.lens === "white_space") ws.set(a.signal_id, a);
  }

  // Kişi-sinyal başına EN SON karar (load-decisions.ts ile aynı dedupe kuralı).
  const sorted = [...decisions].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  const seen = new Set<string>();
  const latest: DecisionRow[] = [];
  for (const d of sorted) {
    const k = `${d.signal_id}|${d.decided_by ?? "web"}`;
    if (seen.has(k)) continue;
    seen.add(k);
    latest.push(d);
  }

  const autoBySignal = new Map<string, Band[]>();
  const allBySignal = new Map<string, Band[]>();
  for (const d of debates) {
    if (d.kind !== "manual") autoBySignal.set(d.signal_id, [...(autoBySignal.get(d.signal_id) ?? []), d.final_verdict]);
    allBySignal.set(d.signal_id, [...(allBySignal.get(d.signal_id) ?? []), d.final_verdict]);
  }

  console.log(`\nveri: ${analyses.length} analiz · ${decisions.length} karar · ${debates.length} tartışma\n`);

  // ── 1. Ham AI bandı ↔ insan ──────────────────────────────────────
  console.log("=== HAM AI BANDI vs İNSAN (taban %22 kovala kesinliği) ===");
  const band = (f: number): Band => (f >= 80 ? "pursue" : f >= 50 ? "watch" : "kill");
  const matrix: Record<string, Record<string, number>> = {};
  let agree = 0;
  let scored = 0;
  for (const d of latest) {
    const a = arb.get(d.signal_id);
    if (!a) continue;
    const b = band(a.fit);
    matrix[b] ??= {};
    matrix[b]![d.decision] = (matrix[b]![d.decision] ?? 0) + 1;
    scored++;
    if (b === d.decision) agree++;
  }
  for (const b of ["pursue", "watch", "kill"] as Band[]) {
    const row = matrix[b] ?? {};
    const tot = Object.values(row).reduce((x, y) => x + y, 0);
    if (!tot) continue;
    const cells = (["pursue", "watch", "kill"] as Band[])
      .map((k) => `${TR[k]} ${String(row[k] ?? 0).padStart(3)}`)
      .join(" | ");
    console.log(`AI ${TR[b].padEnd(6)} (n=${String(tot).padStart(3)}) -> ${cells}`);
  }
  console.log(`tam uyum: ${pct(agree, scored)}`);

  // ── 2. Kapılı bant ↔ insan (asıl ölçüm) ──────────────────────────
  console.log("\n=== YORUMCU KAPISI SONRASI (hedef ≥%50) ===");
  const buckets: Record<string, { agreed: number; total: number }> = {};
  for (const d of latest) {
    const a = arb.get(d.signal_id);
    if (!a) continue;
    const g = gateOf(band(a.fit), autoBySignal.get(d.signal_id) ?? []);
    if (g.band !== "pursue") continue;
    buckets[g.gate] ??= { agreed: 0, total: 0 };
    buckets[g.gate]!.total++;
    if (d.decision === "pursue") buckets[g.gate]!.agreed++;
  }
  const all = Object.values(buckets).reduce((acc, b) => ({ agreed: acc.agreed + b.agreed, total: acc.total + b.total }), { agreed: 0, total: 0 });
  console.log(`kapılı kovala kesinliği: ${pct(all.agreed, all.total)}`);
  for (const [gate, b] of Object.entries(buckets)) console.log(`  ${gate.padEnd(10)}: ${pct(b.agreed, b.total)}`);
  const pending = [...arb.values()].filter(
    (a) => a.fit >= 80 && (autoBySignal.get(a.signal_id)?.length ?? 0) < GATE_REQUIRED,
  ).length;
  console.log(`kapı kuyruğu (2 tur beklemede): ${pending} sinyal`);

  // ── 3. Yorumcu ↔ insan + tutarlılık ──────────────────────────────
  console.log("\n=== AI YORUMCUSU (taban: insanla %60 uyum, test-retest %67) ===");
  const latestDebate = new Map<string, Band>();
  for (const d of [...debates].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))) {
    if (!latestDebate.has(d.signal_id)) latestDebate.set(d.signal_id, d.final_verdict);
  }
  let dAgree = 0;
  let dTot = 0;
  for (const d of latest) {
    const v = latestDebate.get(d.signal_id);
    if (!v) continue;
    dTot++;
    if (v === d.decision) dAgree++;
  }
  console.log(`yorumcu ↔ insan uyum: ${pct(dAgree, dTot)}`);
  const mix = { pursue: 0, watch: 0, kill: 0 };
  for (const d of debates) mix[d.final_verdict]++;
  console.log(`verdict karışımı: ${mix.pursue} kovala / ${mix.watch} izle / ${mix.kill} ele (taban 3/62/195)`);
  let same = 0;
  let diff = 0;
  for (const [, vs] of allBySignal) {
    if (vs.length < 2) continue;
    new Set(vs).size === 1 ? same++ : diff++;
  }
  console.log(`test-retest tutarlılığı: ${pct(same, same + diff)} (${diff} sinyal farklı sonuç verdi)`);

  // ── 4. Beyaz-alan / grounding ────────────────────────────────────
  console.log("\n=== BEYAZ-ALAN (taban: low %66, ws≥60 → %40, ws<60 → %7) ===");
  const wsRows = [...ws.values()];
  const low = wsRows.filter((r) => r.confidence === "low").length;
  console.log(`confidence:low oranı: ${pct(low, wsRows.length)}  <- grounding'in TEK ölçütü`);
  const hi = latest.filter((d) => (arb.get(d.signal_id)?.fit ?? 0) >= 80 && ws.has(d.signal_id));
  const gap = hi.filter((d) => ws.get(d.signal_id)!.fit >= 60);
  const crowded = hi.filter((d) => ws.get(d.signal_id)!.fit < 60);
  console.log(`arbitraj 80+ & ws≥60 → insan-kovala: ${pct(gap.filter((d) => d.decision === "pursue").length, gap.length)}`);
  console.log(`arbitraj 80+ & ws<60 → insan-kovala: ${pct(crowded.filter((d) => d.decision === "pursue").length, crowded.length)}`);
  console.log("");
}

main().catch((e) => {
  console.error("kalibrasyon ölçümü başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
