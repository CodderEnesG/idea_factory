"use client";

import { useMemo, useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import type { SessionUser } from "../lib/session";
import { AppSidebar } from "./AppSidebar";
import { SignalDetail } from "./SignalDetail";
import { formatSource } from "../lib/source-labels";

export interface KilledRow {
  id: string;
  title: string;
  source: string;
}

/** Kararın kartta görünen etkin değeri: ekip kararı > benim > başkasının. */
function decisionOf(c: CardView, override: Map<string, Decision>): Decision {
  return override.get(c.id) ?? c.finalDecision ?? c.mine ?? c.others[0]?.decision ?? "watch";
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

/**
 * Panom — baştan yazıldı (2026-09-24). Karar verdiğin sinyallerin sade takibi: Kovala (yaptığın
 * iş: görev ilerlemesi), İzle (ne zaman dönüp bakacağın), Ele (katlı). Sürükle-bırak, kilitleme,
 * çoklu filtre ve üç ayrı kart dili kaldırıldı; karar değiştirmek satırı açıp düğmeye basmaktır.
 * (Ekip kararı kilidi API'de duruyor, arayüzden çıkarıldı.)
 */
export function PanomBoard({
  cards,
  killed,
  me,
  meName,
}: {
  cards: CardView[];
  killed: KilledRow[];
  me: SessionUser | null;
  meName: string;
}) {
  const [override, setOverride] = useState<Map<string, Decision>>(new Map());
  const [openId, setOpenId] = useState<string | null>(null);
  const [killOpen, setKillOpen] = useState(false);

  const { pursue, watch, moved } = useMemo(() => {
    const pursue: CardView[] = [];
    const watch: CardView[] = [];
    let moved = 0;
    for (const c of cards) {
      const d = decisionOf(c, override);
      if (d === "pursue") pursue.push(c);
      else if (d === "watch") watch.push(c);
      else moved++; // burada Ele'ye çevrilenler bir sonraki yenilemede Ele listesine düşer
    }
    // İzle: gözden geçirme vakti gelenler üstte.
    const now = Date.now();
    const due = (c: CardView) => (c.watchReviewAt && Date.parse(c.watchReviewAt) <= now ? 0 : 1);
    watch.sort((a, b) => due(a) - due(b) || (a.watchReviewAt ?? "").localeCompare(b.watchReviewAt ?? ""));
    return { pursue, watch, moved };
  }, [cards, override]);

  const row = (c: CardView, right: React.ReactNode) => {
    const open = openId === c.id;
    return (
      <li key={c.id} className="border-b border-white/[0.06] last:border-b-0">
        <button
          type="button"
          onClick={() => setOpenId(open ? null : c.id)}
          aria-expanded={open}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${open ? "bg-white/[0.04]" : "hover:bg-white/[0.025]"}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] text-ink">{c.title}</span>
            <span className="block truncate font-mono text-[10.5px] text-ink-muted">
              {formatSource(c.source)}
              {c.sector && ` · ${c.sector}`}
            </span>
          </span>
          {right}
          <span className="font-mono text-xs font-bold text-ink-muted">{c.fit}</span>
        </button>
        {open && (
          <div className="border-t border-white/[0.06] bg-white/[0.015] px-5 py-5">
            <SignalDetail card={c} meName={meName} onDecided={(d) => setOverride((m) => new Map(m).set(c.id, d))} />
          </div>
        )}
      </li>
    );
  };

  const progress = (c: CardView) => {
    const total = c.tasks.length;
    if (total === 0) return <span className="text-[11px] text-ink-muted">görev yok</span>;
    const done = c.tasks.filter((t) => t.done).length;
    return (
      <span className="flex shrink-0 items-center gap-2 text-[11px] text-ink-secondary">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.08]">
          <span className="block h-full rounded-full bg-pursue" style={{ width: `${(100 * done) / total}%` }} />
        </span>
        {done}/{total}
      </span>
    );
  };

  const reviewNote = (c: CardView) => {
    if (!c.watchReviewAt) return null;
    const due = Date.parse(c.watchReviewAt) <= Date.now();
    return (
      <span className={`shrink-0 text-[11px] ${due ? "font-semibold text-watch" : "text-ink-muted"}`}>
        {due ? "bugün bak" : `${fmtDate(c.watchReviewAt)}'de bak`}
      </span>
    );
  };

  const empty = pursue.length === 0 && watch.length === 0 && killed.length === 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="panom" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-16 md:pt-8">
          <header className="mb-6">
            <h1 className="font-display text-3xl font-bold">Panom</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {pursue.length} kovaladığın · {watch.length} izlediğin · {killed.length + moved} elediğin
            </p>
          </header>

          {empty ? (
            <div className="glass p-8 text-center text-sm text-ink-secondary">
              Henüz karar vermedin. Gelen kutusundan başla.
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-pursue">
                  <span className="h-2 w-2 rounded-full bg-pursue" /> Kovala · {pursue.length}
                </h2>
                {pursue.length === 0 ? (
                  <p className="rounded-card border border-hair bg-surface px-4 py-4 text-sm text-ink-muted">Kovaladığın sinyal yok.</p>
                ) : (
                  <ul className="overflow-hidden rounded-card border border-hair bg-surface">{pursue.map((c) => row(c, progress(c)))}</ul>
                )}
              </section>

              <section>
                <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-watch">
                  <span className="h-2 w-2 rounded-full bg-watch" /> İzle · {watch.length}
                </h2>
                {watch.length === 0 ? (
                  <p className="rounded-card border border-hair bg-surface px-4 py-4 text-sm text-ink-muted">İzlediğin sinyal yok.</p>
                ) : (
                  <ul className="overflow-hidden rounded-card border border-hair bg-surface">{watch.map((c) => row(c, reviewNote(c)))}</ul>
                )}
              </section>

              <section>
                <button
                  type="button"
                  onClick={() => setKillOpen((v) => !v)}
                  aria-expanded={killOpen}
                  className="flex items-center gap-2 font-display text-sm font-semibold text-kill"
                >
                  <span className="h-2 w-2 rounded-full bg-kill" /> Ele · {killed.length + moved}
                  <span className="text-xs font-normal text-ink-muted">{killOpen ? "gizle" : "göster"}</span>
                </button>
                {killOpen && (
                  <ul className="mt-2 divide-y divide-white/[0.06] overflow-hidden rounded-card border border-hair bg-surface">
                    {killed.map((k) => (
                      <li key={k.id}>
                        <a href={`/queue?id=${encodeURIComponent(k.id)}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-white/[0.025] hover:text-ink">
                          <span className="min-w-0 flex-1 truncate">{k.title}</span>
                          <span className="shrink-0 font-mono text-[10.5px] text-ink-muted">{formatSource(k.source)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
