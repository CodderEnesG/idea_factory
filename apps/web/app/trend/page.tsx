import { composite, type Lens, type RankedItem } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { AppSidebar } from "../../components/AppSidebar";
import { BandLegend } from "../../components/BandBar";

export const dynamic = "force-dynamic";

const WEEKS = 12;
const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

interface WeekBucket {
  weekStart: Date;
  count: number;
  pursue: number;
  watch: number;
  kill: number;
}

function weekStartOf(d: Date): Date {
  const day = (d.getUTCDay() + 6) % 7; // Pazartesi=0
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

function itemTs(item: RankedItem): Date | null {
  const iso = item.signal.posted_at ?? item.signal.fetched_at;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t);
}

function bucketWeekly(items: RankedItem[], lensRegistry: Lens[]): WeekBucket[] {
  const thisWeek = weekStartOf(new Date());
  const buckets: WeekBucket[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    buckets.push({
      weekStart: new Date(thisWeek.getTime() - i * MS_WEEK),
      count: 0,
      pursue: 0,
      watch: 0,
      kill: 0,
    });
  }
  const byStart = new Map(buckets.map((b) => [b.weekStart.getTime(), b]));
  const earliest = buckets[0]!.weekStart.getTime();

  for (const item of items) {
    const ts = itemTs(item);
    if (!ts) continue;
    const start = weekStartOf(ts).getTime();
    if (start < earliest) continue;
    const bucket = byStart.get(start);
    if (!bucket) continue;
    bucket.count++;
    bucket[composite(item.analyses, lensRegistry).band]++;
  }
  return buckets;
}

/** Son N/2 hafta vs önceki N/2 hafta — sektör/kaynak dağılım karşılaştırması (delta). */
function distributionShift(
  items: RankedItem[],
  pick: (i: RankedItem) => string | null,
): { label: string; recent: number; prior: number }[] {
  const now = Date.now();
  const cutoff = now - (WEEKS / 2) * MS_WEEK;
  const windowStart = now - WEEKS * MS_WEEK;
  const counts = new Map<string, { recent: number; prior: number }>();

  for (const item of items) {
    const ts = itemTs(item)?.getTime();
    if (!ts || ts < windowStart) continue;
    const key = pick(item) ?? "bilinmiyor";
    const entry = counts.get(key) ?? { recent: 0, prior: 0 };
    if (ts >= cutoff) entry.recent++;
    else entry.prior++;
    counts.set(key, entry);
  }

  return [...counts.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.recent + b.prior - (a.recent + a.prior))
    .slice(0, 8);
}

function fmtWeek(d: Date): string {
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function ShiftTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; recent: number; prior: number }[];
}) {
  return (
    <div className="glass p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-ink-muted">
            <th className="pb-1 text-left font-medium">Ad</th>
            <th className="pb-1 text-right font-medium">son {WEEKS / 2}h</th>
            <th className="pb-1 text-right font-medium">önceki {WEEKS / 2}h</th>
            <th className="pb-1 text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const delta = r.recent - r.prior;
            return (
              <tr key={r.label} className="border-t border-hair">
                <td className="py-1.5 text-ink">{r.label}</td>
                <td className="py-1.5 text-right text-ink-secondary">{r.recent}</td>
                <td className="py-1.5 text-right text-ink-muted">{r.prior}</td>
                <td
                  className={`py-1.5 text-right font-medium ${
                    delta > 0 ? "text-pursue" : delta < 0 ? "text-kill" : "text-ink-muted"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-center text-ink-muted">
                veri yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default async function TrendPage() {
  const [{ items, demo, error: loadError }, me, lensRegistry] = await Promise.all([
    loadItems(),
    getSession(),
    loadLensRegistry(),
  ]);
  const weeks = bucketWeekly(items, lensRegistry);
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  const sectorShift = distributionShift(items, (i) => i.signal.sector);
  const sourceShift = distributionShift(items, (i) => i.signal.source);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="trend" />
      <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 md:pt-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl font-bold">Trend Raporu</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {items.length} sinyal · son {WEEKS} hafta · bant/sektör/kaynak dağılım değişimi
            </p>
          </div>
          <BandLegend />
        </header>

        {loadError && (
          <div role="alert" className="mb-4 rounded-btn border border-strong bg-elevated px-4 py-2 text-sm text-kill">
            Veriler yüklenemedi — {loadError}. Sayfayı yenile.
          </div>
        )}
        {demo && (
          <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
            Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
          </div>
        )}

        <div className="glass p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Haftalık hacim ve bant dağılımı
          </h2>
          <div className="flex h-40 items-end gap-1.5">
            {weeks.map((w) => (
              <div
                key={w.weekStart.toISOString()}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm"
                  style={{ height: `${(w.count / maxCount) * 100}%`, minHeight: w.count > 0 ? 4 : 0 }}
                  title={`${fmtWeek(w.weekStart)}: ${w.count} sinyal (kovala ${w.pursue} · izle ${w.watch} · ele ${w.kill})`}
                >
                  {w.kill > 0 && (
                    <div className="w-full bg-kill" style={{ height: `${(w.kill / w.count) * 100}%` }} />
                  )}
                  {w.watch > 0 && (
                    <div className="w-full bg-watch" style={{ height: `${(w.watch / w.count) * 100}%` }} />
                  )}
                  {w.pursue > 0 && (
                    <div className="w-full bg-pursue" style={{ height: `${(w.pursue / w.count) * 100}%` }} />
                  )}
                </div>
                <span className="text-[10px] text-ink-muted">{fmtWeek(w.weekStart)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <ShiftTable title="Sektör dağılımı" rows={sectorShift} />
          <ShiftTable title="Kaynak dağılımı" rows={sourceShift} />
        </div>
      </div>
      </main>
    </div>
  );
}
