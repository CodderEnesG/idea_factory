import Link from "next/link";
import {
  isBench,
  rank,
  type ArbitrageAnalysis,
  type RankedItem,
  type Signal,
} from "@idea-factory/core";
import { serverDb } from "../../lib/supabase";
import { DEMO_ITEMS } from "../../lib/demo";
import { OpportunityCard } from "../../components/OpportunityCard";

export const dynamic = "force-dynamic";

async function loadItems(): Promise<{ items: RankedItem[]; demo: boolean }> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true };
  const { data, error } = await db.from("analyses").select("*, signals(*)").eq("lens", "arbitrage");
  if (error || !data || data.length === 0) return { items: DEMO_ITEMS, demo: true };
  const items = data
    .filter((r) => (r as { signals?: unknown }).signals)
    .map((r) => {
      const { signals, ...analysis } = r as Record<string, unknown> & { signals: Signal };
      return { signal: signals, analysis: analysis as unknown as ArbitrageAnalysis };
    });
  return { items, demo: false };
}

export default async function Queue({
  searchParams,
}: {
  searchParams?: { bench?: string };
}) {
  const { items, demo } = await loadItems();
  const benchOnly = searchParams?.bench === "1";
  const all = rank(items);
  const benchCount = all.filter((i) => isBench(i.analysis)).length;
  const ranked = benchOnly ? all.filter((i) => isBench(i.analysis)) : all;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-ink-muted hover:text-ink">
            ← Idea Factory
          </Link>
          <h1 className="mt-1 font-display text-3xl font-bold">Fırsat Kuyruğu</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {ranked.length} fırsat · arbitraj merceği · Türkiye tezi
          </p>
          <nav className="mt-3 flex gap-2 text-xs">
            <Link
              href="/queue"
              className={`chip ${!benchOnly ? "border-strong text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              Tümü ({all.length})
            </Link>
            <Link
              href="/queue?bench=1"
              className={`chip ${benchOnly ? "border-strong text-ink" : "text-ink-muted hover:text-ink"}`}
            >
              🏅 Bench ({benchCount})
            </Link>
          </nav>
        </div>
      </header>

      {demo && (
        <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
          Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>'e key ekle.
        </div>
      )}

      <div className="space-y-4">
        {ranked.length === 0 && benchOnly && (
          <p className="text-sm text-ink-muted">
            Bench çıtasını (fit ≥ 80 · güven yüksek) geçen fırsat yok.
          </p>
        )}
        {ranked.map((item) => (
          <OpportunityCard key={item.signal.id} item={item} />
        ))}
      </div>
    </main>
  );
}
