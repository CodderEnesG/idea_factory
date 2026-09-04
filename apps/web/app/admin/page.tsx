import { requireAdmin, getSession } from "../../lib/auth";
import { serverDb } from "../../lib/supabase";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadActiveThesis } from "../../lib/active-thesis";
import { loadActiveIngestionSettings } from "../../lib/active-ingestion-settings";
import {
  weeklyQualified,
  noiseRatio,
  decisionRatio,
  latestDecisionPerSignal,
  finalizedPursueCount,
  pursuePrecision,
  debateVerdictMix,
  groundingCoverage,
  type PursuePrecisionInput,
} from "../../lib/metrics";
import { loadDebates } from "../../lib/load-debates";
import { buildCompetitionView, resolveCardBands } from "../../lib/build-card-view";
import { composite } from "@idea-factory/core";
import { isMissingColumn } from "../../lib/pg-compat";
import { loadFinalDecisions } from "../../lib/load-final-decisions";
import { computeSourceHealth, type SourceHealth, type SourceStatus } from "../../lib/source-health";
import { formatSource } from "../../lib/source-labels";
import { AppSidebar } from "../../components/AppSidebar";
import { AdminSettings, type AdminTabKey } from "../../components/AdminSettings";
import { ThesisForm } from "../../components/ThesisForm";
import { LensManager, type LensRow } from "../../components/LensManager";
import { IngestionSettingsForm } from "../../components/IngestionSettingsForm";

export const dynamic = "force-dynamic";

const WEEKS = 8;

async function loadLenses(): Promise<LensRow[]> {
  const db = serverDb();
  if (!db) return [];
  const BASE = "lens_id, name, weight, extra_note_label, questions, active, created_by, created_at";
  let res = (await db
    .from("lenses")
    .select(`${BASE}, grounding`)
    .order("created_at", { ascending: true })) as {
    data: LensRow[] | null;
    error: { code?: string; message: string } | null;
  };
  // 0015 uygulanmadıysa grounding'siz oku — yoksa mercek yönetimi sayfası tamamen boş kalır.
  if (isMissingColumn(res.error)) {
    res = (await db.from("lenses").select(BASE).order("created_at", { ascending: true })) as typeof res;
  }
  if (res.error) console.error("[admin/lenses] sorgu hatası:", res.error.message);
  return res.data ?? [];
}

/** Karar/sinyal + "kovala" bağlamı için ham `decisions` satırları (created_at DESC). */
async function loadDecisionRows(): Promise<{ signal_id: string; decision: "pursue" | "watch" | "kill" }[]> {
  const db = serverDb();
  if (!db) return [];
  const { data, error } = await db
    .from("decisions")
    .select("signal_id, decision, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as { signal_id: string; decision: "pursue" | "watch" | "kill" }[];
}

/** Kaynak sağlığı için son 30 günün ham (source, fetched_at) çiftleri. */
async function loadSourceRows(): Promise<{ source: string; fetched_at: string }[]> {
  const db = serverDb();
  if (!db) return [];
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await db.from("signals").select("source, fetched_at").gte("fetched_at", since);
  if (error || !data) return [];
  return data as { source: string; fetched_at: string }[];
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtWeek(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-secondary">{hint}</div>}
    </div>
  );
}

function UnmeasuredTile({ label, why }: { label: string; why: string }) {
  return (
    <div className="glass p-4 opacity-70">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-ink-muted">—</div>
      <div className="mt-1 text-xs text-ink-secondary">Ölçülemiyor: {why}</div>
    </div>
  );
}

const STATUS_LABEL: Record<SourceStatus, string> = {
  ok: "sağlıklı",
  warn: "yavaşladı",
  critical: "sessiz",
  never: "hiç veri yok",
};
const STATUS_DOT: Record<SourceStatus, string> = {
  ok: "bg-pursue",
  warn: "bg-watch",
  critical: "bg-kill",
  never: "bg-ink-muted",
};

function fmtLastSeen(d: Date | null): string {
  if (!d) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  return `${days} gün önce`;
}

function SourceHealthTable({ rows }: { rows: SourceHealth[] }) {
  return (
    <div className="glass p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Kaynak sağlığı (son 30 gün)
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-ink-muted">
            <th className="pb-1 text-left font-medium">Kaynak</th>
            <th className="pb-1 text-right font-medium">son 7g</th>
            <th className="pb-1 text-right font-medium">son 30g</th>
            <th className="pb-1 text-right font-medium">son görülen</th>
            <th className="pb-1 text-right font-medium">durum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-hair">
              <td className="py-1.5 text-ink">{formatSource(r.name)}</td>
              <td className="py-1.5 text-right text-ink-secondary">{r.last7d}</td>
              <td className="py-1.5 text-right text-ink-muted">{r.last30d}</td>
              <td className="py-1.5 text-right text-ink-muted">{fmtLastSeen(r.lastSeen)}</td>
              <td className="py-1.5 text-right">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`} />
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const VALID_TABS: AdminTabKey[] = ["tez", "mercekler", "toplama", "metrikler"];

/**
 * Ayarlar (backlog #9): eskiden dört ayrı sayfa (/admin/tez, /admin/mercekler, /admin/toplama,
 * /admin/metrikler) — şimdi tek route, tek sekmeli sayfa (bkz. AdminSettings.tsx). Bu server
 * component hepsinin verisini paralel yükler; sekme geçişi tamamen istemci tarafında, yeniden
 * fetch yok. Eski route'lar (`/admin/tez` vb.) `?tab=` ile buraya yönlendirilir (bkz. o dosyalar).
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const [admin, me] = await Promise.all([requireAdmin(), getSession()]);
  const initialTab: AdminTabKey = VALID_TABS.includes(searchParams.tab as AdminTabKey)
    ? (searchParams.tab as AdminTabKey)
    : "tez";

  if (!admin) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar me={me} current={initialTab} />
        <div className="min-w-0 flex-1 overflow-y-auto px-6 pt-24 pb-16 text-center text-sm text-ink-muted md:pt-16">
          Bu sayfa yalnız adminlere açık.
        </div>
      </div>
    );
  }

  const [thesis, customLenses, ingestionSettings, { items, demo, error: loadError }, decisionRows, sourceRows, lensRegistry, finalDecisions, debateRes] =
    await Promise.all([
      loadActiveThesis(),
      loadLenses(),
      loadActiveIngestionSettings(),
      loadItems(),
      loadDecisionRows(),
      loadSourceRows(),
      loadLensRegistry(),
      loadFinalDecisions(),
      loadDebates(),
    ]);

  const sourceHealth = computeSourceHealth(sourceRows);
  const weeks = weeklyQualified(items, WEEKS, new Date(), lensRegistry);
  const thisWeek = weeks.at(-1) ?? { qualified: 0, total: 0, weekStart: new Date() };
  const maxQualified = Math.max(1, ...weeks.map((w) => w.qualified));
  const decidedSignalCount = new Set(decisionRows.map((r) => r.signal_id)).size;
  const engagementRatio = decisionRatio(items.length, decidedSignalCount);
  const latest = latestDecisionPerSignal(decisionRows);
  const pursueCount = [...latest.values()].filter((d) => d === "pursue").length;
  const noise = noiseRatio(items, lensRegistry);
  const finalizedPursue = finalizedPursueCount([...finalDecisions.values()]);

  // Kalibrasyon (FAZ6_PLAN.md §Faz 5.5) — kapının ve grounding'in işe yarayıp yaramadığı.
  const precisionRows: PursuePrecisionInput[] = items.map((item) => {
    const comp = composite(item.analyses, lensRegistry);
    const bands = resolveCardBands({
      comp,
      mine: null,
      final: finalDecisions.get(item.signal.id)?.decision ?? null,
      debates: debateRes.map.get(item.signal.id) ?? [],
      gateEnabled: !demo,
    });
    return {
      signalId: item.signal.id,
      gatedBand: bands.gatedBand,
      gate: bands.gate,
      competition: buildCompetitionView(item.analyses, lensRegistry)?.label ?? null,
    };
  });
  const precision = pursuePrecision(precisionRows, latest);
  const verdictMix = debateVerdictMix(
    [...debateRes.map.values()].flat().map((d) => d.final_verdict),
  );
  const grounding = groundingCoverage(
    items.flatMap((i) => Object.values(i.analyses).map((a) => ({ lens: a.lens, confidence: a.confidence }))),
  );
  const gatePending = precisionRows.filter((r) => r.gate === "pending").length;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current={initialTab} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <AdminSettings
          initialTab={initialTab}
          tez={
            <div className="max-w-2xl">
              <h2 className="font-display text-xl font-bold text-ink">Tez</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Mevcut versiyon: {thesis.version}. Kaydetmek yeni bir versiyon açar; eski
                versiyonlar denetim/rollback için durur.
              </p>
              <div className="mt-6">
                <ThesisForm initial={thesis} />
              </div>
            </div>
          }
          mercekler={
            <div className="max-w-2xl">
              <h2 className="font-display text-xl font-bold text-ink">Mercekler</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Arbitraj ve Beyaz-alan kod-tanımlı builtin mercekler — burada düzenlenemez. Admin
                yalnız ad + ağırlık + not etiketi + domain soru listesi girer; ön kapı/fit-bant/atıf
                kuralları koddan sabit gelir.
              </p>
              <div className="mt-6">
                <LensManager initial={customLenses} />
              </div>
            </div>
          }
          toplama={
            <div className="max-w-2xl">
              <h2 className="font-display text-xl font-bold text-ink">Toplama</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Mevcut versiyon: {ingestionSettings.version}. Kaydetmek yeni bir versiyon açar;
                eski versiyonlar denetim/rollback için durur. Değişiklik bir sonraki{" "}
                <code>pnpm ingest</code> koşusundan itibaren geçerli olur.
              </p>
              <div className="mt-6">
                <IngestionSettingsForm initial={ingestionSettings} />
              </div>
            </div>
          }
          metrikler={
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Metrikler</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Kuzey Yıldızı + öncü göstergeler (BUSINESS_MODEL.md §5) — mevcut tablolardan
                agregasyon, ek AI maliyeti yok.
              </p>

              {demo && (
                <div className="mt-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
                  Demo modu — Supabase env yok. Gerçek sayılar için <code>.env</code>&apos;e key ekle.
                </div>
              )}
              {loadError && (
                <div role="alert" className="mt-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-kill">
                  Veriler yüklenemedi — {loadError}. Sayfayı yenile.
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
                <StatTile
                  label="Kesinleşmiş fırsat (kovala)"
                  value={String(finalizedPursue)}
                  hint={`${finalDecisions.size} sinyal kilitlendi — problem 1/2: ekibin gerçekten karar verdiği sayı`}
                />
                <StatTile
                  label="Nitelikli fırsat (bu hafta)"
                  value={String(thisWeek.qualified)}
                  hint={`${thisWeek.total} sinyalden`}
                />
                <StatTile
                  label="Karar/sinyal oranı"
                  value={pct(engagementRatio)}
                  hint={`${decidedSignalCount}/${items.length} sinyal en az 1 karar aldı`}
                />
                <StatTile
                  label="Gürültü oranı (karşı-metrik)"
                  value={pct(noise)}
                  hint="analiz edilenlerin 'ele' bandı payı"
                />
                <StatTile label="Toplam analiz edilmiş sinyal" value={String(items.length)} />
              </div>

              <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Kalibrasyon — Yorumcu kapısı işe yarıyor mu
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                İnsan kararlarına karşı ölçüm. Kapı öncesi taban: <strong>%22</strong> (79
                AI-kovala sinyalin 17'sinde insan da kovala dedi, 36'sı ele edildi). Çekince:
                bu <em>insan incelemesine</em> karşı kesinliktir ve kovala-bandı sinyallerinin
                yalnız bir kısmı incelenmiştir — insanlar zaten ilginç görüneni inceliyor.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatTile
                  label="Kovala kesinliği (kapılı)"
                  value={precision.overall.precision === null ? "—" : pct(precision.overall.precision)}
                  hint={`${precision.overall.agreed}/${precision.overall.reviewed} incelenmiş · taban %22`}
                />
                <StatTile
                  label="Yorumcu onayladı"
                  value={precision.byGate.confirmed.precision === null ? "—" : pct(precision.byGate.confirmed.precision)}
                  hint={`${precision.byGate.confirmed.agreed}/${precision.byGate.confirmed.reviewed} · hedef ≥%50`}
                />
                <StatTile
                  label="Yorumcu çekinceli"
                  value={precision.byGate.caveat.precision === null ? "—" : pct(precision.byGate.caveat.precision)}
                  hint={`${precision.byGate.caveat.agreed}/${precision.byGate.caveat.reviewed} · ikisi de "izle" dedi`}
                />
                <StatTile
                  label="Kapı kuyruğu"
                  value={String(gatePending)}
                  hint="AI kovala dedi, 2 tartışma tamamlanmadı — İzle bandında bekliyor"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatTile
                  label="Yorumcu verdict karışımı"
                  value={`${verdictMix.pursue}/${verdictMix.watch}/${verdictMix.kill}`}
                  hint="kovala/izle/ele · taban 3/62/195 — 0/26/74'e çökerse kapı kuyruğu boğuyor"
                />
                <StatTile
                  label="Beyaz-alan: boşluk gerçek"
                  value={precision.byCompetition["boş"]?.precision === null ? "—" : pct(precision.byCompetition["boş"]!.precision!)}
                  hint={`${precision.byCompetition["boş"]?.agreed ?? 0}/${precision.byCompetition["boş"]?.reviewed ?? 0} · ws≥60, taban %40 (n=10)`}
                />
                <StatTile
                  label="Beyaz-alan: kalabalık"
                  value={precision.byCompetition["kalabalık"]?.precision === null ? "—" : pct(precision.byCompetition["kalabalık"]!.precision!)}
                  hint={`${precision.byCompetition["kalabalık"]?.agreed ?? 0}/${precision.byCompetition["kalabalık"]?.reviewed ?? 0} · ws<40, taban %7 (n=28)`}
                />
                <StatTile
                  label="Beyaz-alan düşük güven"
                  value={grounding.lowRatio === null ? "—" : pct(grounding.lowRatio)}
                  hint={`${grounding.low}/${grounding.total} · taban %66 — grounding'in TEK ölçütü, düşmezse geri alınır`}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <UnmeasuredTile
                  label={`"Kovala" isabeti (gerçek dünya)`}
                  why={`insan kararına karşı ölçüm yukarıda. Gerçek dünyada ne olduğu (geliştirildi mi, pazara çıktı mı) bilinçli olarak uygulamada takip EDİLMİYOR — şu an ${pursueCount} sinyalin son kararı "kovala".`}
                />
                <UnmeasuredTile
                  label="Bilgi-tabanı sorgu kullanımı"
                  why="knowledge-db.ts sorgu sayısını loglamıyor — ölçmek için ayrı bir instrumentation gerekir."
                />
              </div>

              <div className="mt-4 glass p-4">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Haftalık nitelikli fırsat sayısı (son {WEEKS} hafta)
                </h2>
                <div className="flex h-32 items-end gap-1.5">
                  {weeks.map((w) => (
                    <div key={w.weekStart.toISOString()} className="flex flex-1 flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t-sm bg-brand"
                        style={{
                          height: `${(w.qualified / maxQualified) * 100}%`,
                          minHeight: w.qualified > 0 ? 4 : 0,
                        }}
                        title={`${fmtWeek(w.weekStart)}: ${w.qualified}/${w.total} nitelikli`}
                      />
                      <span className="text-[10px] text-ink-muted">{fmtWeek(w.weekStart)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <SourceHealthTable rows={sourceHealth} />
              </div>
            </div>
          }
        />
      </main>
    </div>
  );
}
