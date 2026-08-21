import { composite, isBench, type Lens, type RankedItem } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { AppSidebar } from "../../components/AppSidebar";
import { BandBar, BandLegend } from "../../components/BandBar";
import { IconAward } from "../../components/icons";

export const dynamic = "force-dynamic";

interface Bucket {
  name: string;
  count: number;
  pursue: number;
  watch: number;
  kill: number;
  bench: number;
}

const TOP_N = 12;

function bucketBy(
  items: RankedItem[],
  pick: (i: RankedItem) => string | null,
  lensRegistry: Lens[],
): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const item of items) {
    const name = pick(item) ?? "bilinmiyor";
    const b = map.get(name) ?? { name, count: 0, pursue: 0, watch: 0, kill: 0, bench: 0 };
    const comp = composite(item.analyses, lensRegistry);
    b.count++;
    b[comp.band]++;
    if (isBench(comp)) b.bench++;
    map.set(name, b);
  }
  const sorted = [...map.values()].sort((a, b) => b.count - a.count);
  if (sorted.length <= TOP_N) return sorted;
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const other: Bucket = rest.reduce(
    (acc, b) => ({
      name: `Diğer (${rest.length})`,
      count: acc.count + b.count,
      pursue: acc.pursue + b.pursue,
      watch: acc.watch + b.watch,
      kill: acc.kill + b.kill,
      bench: acc.bench + b.bench,
    }),
    { name: "", count: 0, pursue: 0, watch: 0, kill: 0, bench: 0 },
  );
  return [...top, other];
}

function BucketList({ title, buckets }: { title: string; buckets: Bucket[] }) {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="glass p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink">{b.name}</span>
              <span className="flex items-center gap-2 text-ink-muted">
                {b.bench > 0 && (
                  <span title="bench" className="inline-flex items-center gap-1">
                    <IconAward className="h-3 w-3" /> {b.bench}
                  </span>
                )}
                <span className="font-display font-semibold text-ink">{b.count}</span>
              </span>
            </div>
            <div style={{ width: `${(b.count / maxCount) * 100}%` }}>
              <BandBar pursue={b.pursue} watch={b.watch} kill={b.kill} />
            </div>
          </div>
        ))}
        {buckets.length === 0 && <p className="text-sm text-ink-muted">veri yok</p>}
      </div>
    </div>
  );
}

export default async function HaritaPage() {
  const [{ items, demo }, me, lensRegistry] = await Promise.all([
    loadItems(),
    getSession(),
    loadLensRegistry(),
  ]);
  const sectors = bucketBy(items, (i) => i.signal.sector, lensRegistry);
  const markets = bucketBy(items, (i) => i.signal.market, lensRegistry);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="harita" />
      <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 md:pt-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-3xl font-bold">Sektör Haritası</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {items.length} sinyal · en yoğun {TOP_N} sektör/pazar · çubuk uzunluğu = hacim, renk = bant
            </p>
          </div>
          <BandLegend />
        </header>

        {demo && (
          <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
            Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">Henüz analiz edilmiş sinyal yok.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <BucketList title="Sektörler" buckets={sectors} />
            <BucketList title="Pazarlar" buckets={markets} />
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
