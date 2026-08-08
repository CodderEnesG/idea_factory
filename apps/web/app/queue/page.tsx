import { lenses, rank, type BaseAnalysis, type RankedItem, type Signal } from "@idea-factory/core";
import { serverDb } from "../../lib/supabase";
import { getSession } from "../../lib/auth";
import { DEMO_ITEMS } from "../../lib/demo";
import { buildCardView } from "../../lib/build-card-view";
import { Navbar } from "../../components/Navbar";
import { QueueBoard } from "../../components/QueueBoard";
import type { Decision, UserDecision } from "../../components/DecisionButtons";
import type { Comment } from "../../components/Comments";

export const dynamic = "force-dynamic";

/** Tüm merceklerin analiz satırlarını çeker, sinyal başına `analyses` haritasında gruplar. */
async function loadItems(): Promise<{ items: RankedItem[]; demo: boolean }> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true };
  const { data, error } = await db.from("analyses").select("*, signals(*)");
  if (error || !data || data.length === 0) return { items: DEMO_ITEMS, demo: true };

  const bySignal = new Map<string, RankedItem>();
  for (const r of data) {
    const { signals, ...rest } = r as Record<string, unknown> & { signals?: Signal };
    if (!signals) continue;
    const analysis = rest as unknown as BaseAnalysis;
    const item = bySignal.get(signals.id);
    if (item) item.analyses[analysis.lens] = analysis;
    else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
  }
  return { items: [...bySignal.values()], demo: false };
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

export default async function Queue() {
  const [{ items, demo }, decisions, comments, me] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadComments(),
    getSession(),
  ]);
  const meName = me?.username ?? "web";
  const cards = rank(items).map((item) => {
    const dec = decisions.get(item.signal.id) ?? [];
    const mine = dec.find((d) => d.user === meName)?.decision ?? null;
    const others = dec.filter((d) => d.user !== meName);
    return buildCardView(item, mine, others, comments.get(item.signal.id) ?? []);
  });

  return (
    <>
      <Navbar me={me} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {demo && (
          <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
            Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
          </div>
        )}
        <QueueBoard
          items={cards}
          meName={meName}
          lensSummary={lenses.map((l) => l.name).join(" + ")}
        />
      </main>
    </>
  );
}
