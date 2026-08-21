import { requireAdmin, getSession } from "../../lib/auth";
import { serverDb } from "../../lib/supabase";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadActiveThesis } from "../../lib/active-thesis";
import { loadActiveIngestionSettings } from "../../lib/active-ingestion-settings";
import { weeklyQualified, noiseRatio, decisionRatio, latestDecisionPerSignal, finalizedPursueCount } from "../../lib/metrics";
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
  const { data } = await db
    .from("lenses")
    .select("lens_id, name, weight, extra_note_label, questions, active, created_by, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []) as LensRow[];
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

  const [thesis, customLenses, ingestionSettings, { items, demo }, decisionRows, sourceRows, lensRegistry, finalDecisions] =
    await Promise.all([
      loadActiveThesis(),
      loadLenses(),
      loadActiveIngestionSettings(),
      loadItems(),
      loadDecisionRows(),
      loadSourceRows(),
      loadLensRegistry(),
      loadFinalDecisions(),
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

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <UnmeasuredTile
                  label={`"Kovala" isabeti (North Star)`}
                  why={`gerçek doğrulama/çıktı takibi henüz yok — şu an ${pursueCount} sinyalin son kararı "kovala", ama hangisinin gerçekten değer yarattığı ayrı bir outcome tablosu ister.`}
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
