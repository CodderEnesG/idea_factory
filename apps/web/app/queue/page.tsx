import Link from "next/link";
import {
  isBench,
  rank,
  type ArbitrageAnalysis,
  type RankedItem,
  type Signal,
} from "@idea-factory/core";
import { serverDb } from "../../lib/supabase";
import { getSession } from "../../lib/auth";
import { DEMO_ITEMS } from "../../lib/demo";
import { OpportunityCard } from "../../components/OpportunityCard";
import type { Decision, UserDecision } from "../../components/DecisionButtons";
import type { Comment } from "../../components/Comments";
import { LogoutButton } from "../../components/LogoutButton";

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

/**
 * Sinyal başına TÜM kullanıcıların en son kararı. decisions bir log; en-yeniden geriye okuyup
 * (signal_id, decided_by) başına ilk görüleni (=en yeni) alıyoruz. İşbirlikçi: her kullanıcının
 * kendi kararı ayrı yaşar, kimse diğerini ezmez.
 */
async function loadDecisions(): Promise<Map<string, UserDecision[]>> {
  const db = serverDb();
  const map = new Map<string, UserDecision[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("decisions")
    .select("signal_id, decision, decided_by, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return map;
  const seen = new Set<string>(); // `${signal_id}|${user}`
  for (const row of data as { signal_id: string; decision: Decision; decided_by: string | null }[]) {
    const user = row.decided_by ?? "web";
    const key = `${row.signal_id}|${user}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = map.get(row.signal_id) ?? [];
    arr.push({ user, decision: row.decision });
    map.set(row.signal_id, arr);
  }
  return map;
}

/** Sinyal başına yorum thread'i (eskiden yeniye). */
async function loadComments(): Promise<Map<string, Comment[]>> {
  const db = serverDb();
  const map = new Map<string, Comment[]>();
  if (!db) return map;
  const { data, error } = await db
    .from("comments")
    .select("id, signal_id, author, body, created_at")
    .order("created_at", { ascending: true });
  if (error || !data) return map;
  for (const row of data as (Comment & { signal_id: string })[]) {
    const { signal_id, ...c } = row;
    const arr = map.get(signal_id) ?? [];
    arr.push(c);
    map.set(signal_id, arr);
  }
  return map;
}

export default async function Queue({
  searchParams,
}: {
  searchParams?: { bench?: string };
}) {
  const [{ items, demo }, decisions, comments, me] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadComments(),
    getSession(),
  ]);
  const benchOnly = searchParams?.bench === "1";
  const all = rank(items);
  const benchCount = all.filter((i) => isBench(i.analysis)).length;
  const ranked = benchOnly ? all.filter((i) => isBench(i.analysis)) : all;
  const meName = me?.username ?? "web";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-ink-muted hover:text-ink">
            ← IdeaFact
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
        {me && (
          <div className="shrink-0 text-right">
            <div className="text-sm text-ink">{me.display_name}</div>
            <LogoutButton />
          </div>
        )}
      </header>

      {demo && (
        <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
          Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
        </div>
      )}

      <div className="space-y-4">
        {ranked.length === 0 && benchOnly && (
          <p className="text-sm text-ink-muted">
            Bench çıtasını (fit ≥ 80 · güven yüksek) geçen fırsat yok.
          </p>
        )}
        {ranked.map((item) => {
          const dec = decisions.get(item.signal.id) ?? [];
          const mine = dec.find((d) => d.user === meName)?.decision ?? null;
          const others = dec.filter((d) => d.user !== meName);
          return (
            <OpportunityCard
              key={item.signal.id}
              item={item}
              mine={mine}
              others={others}
              comments={comments.get(item.signal.id) ?? []}
            />
          );
        })}
      </div>
    </main>
  );
}
