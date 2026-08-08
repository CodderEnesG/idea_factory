"use client";

import { useEffect, useMemo, useState } from "react";
import type { CardView } from "../lib/card-view";
import { OpportunityCard } from "./OpportunityCard";

type SortMode = "fit" | "recent";
type ActivityFilter = "all" | "mine" | "friend" | "both";
const PAGE_SIZE = 24;

function freshness(item: CardView): number {
  const t = Date.parse(item.postedAt ?? item.fetchedAt);
  return Number.isNaN(t) ? 0 : t;
}

function activityOf(item: CardView, meName: string): { mine: boolean; friend: boolean } {
  const mine = item.mine !== null || item.comments.some((c) => c.author === meName);
  const friend = item.others.length > 0 || item.comments.some((c) => c.author !== meName);
  return { mine, friend };
}

function distinct(items: CardView[], pick: (i: CardView) => string | null): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const v = pick(i);
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function QueueBoard({
  items,
  meName,
  lensSummary,
}: {
  items: CardView[];
  meName: string;
  lensSummary: string;
}) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [market, setMarket] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<SortMode>("fit");
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [benchOnly, setBenchOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sectors = useMemo(() => distinct(items, (i) => i.sector), [items]);
  const markets = useMemo(() => distinct(items, (i) => i.market), [items]);
  const sources = useMemo(() => distinct(items, (i) => i.source), [items]);

  const counts = useMemo(() => {
    let pursue = 0, watch = 0, kill = 0, bench = 0;
    for (const i of items) {
      if (i.band === "pursue") pursue++;
      else if (i.band === "watch") watch++;
      else kill++;
      if (i.bench) bench++;
    }
    return { pursue, watch, kill, bench };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (sector && i.sector !== sector) return false;
      if (market && i.market !== market) return false;
      if (source && i.source !== source) return false;
      if (benchOnly && !i.bench) return false;
      if (activity !== "all") {
        const a = activityOf(i, meName);
        if (activity === "mine" && !a.mine) return false;
        if (activity === "friend" && !a.friend) return false;
        if (activity === "both" && !(a.mine && a.friend)) return false;
      }
      return true;
    });
    if (sort === "recent") list = [...list].sort((a, b) => freshness(b) - freshness(a));
    return list;
  }, [items, search, sector, market, source, benchOnly, activity, sort, meName]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, sector, market, source, benchOnly, activity, sort]);

  const visible = filtered.slice(0, visibleCount);

  const pillBtn = (active: boolean) =>
    `chip transition ${active ? "border-strong text-ink" : "text-ink-muted hover:text-ink"}`;

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Fırsat Kuyruğu</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {filtered.length} fırsat · {lensSummary} · Türkiye tezi
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-pursue">
            <span className="h-1.5 w-1.5 rounded-full bg-pursue" />
            KOVALA
          </span>
          <span className="font-display text-xl font-bold">{counts.pursue}</span>
        </div>
        <div className="glass flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-watch">
            <span className="h-1.5 w-1.5 rounded-full bg-watch" />
            İZLE
          </span>
          <span className="font-display text-xl font-bold">{counts.watch}</span>
        </div>
        <div className="glass flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-kill">
            <span className="h-1.5 w-1.5 rounded-full bg-kill" />
            ELE
          </span>
          <span className="font-display text-xl font-bold">{counts.kill}</span>
        </div>
      </div>

      <div className="glass mt-4 flex flex-wrap items-center gap-2 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Ara — başlık"
          className="min-w-[160px] flex-1 rounded-btn bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="chip bg-elevated"
        >
          <option value="">Sektör: Tümü</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="chip bg-elevated">
          <option value="">Pazar: Tümü</option>
          {markets.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="chip bg-elevated">
          <option value="">Kaynak: Tümü</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="chip bg-elevated"
        >
          <option value="fit">Sırala: Fit</option>
          <option value="recent">Sırala: En yeni</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button onClick={() => setBenchOnly((v) => !v)} className={pillBtn(benchOnly)}>
          🏅 Bench ({counts.bench})
        </button>
        <button onClick={() => setActivity("all")} className={pillBtn(activity === "all")}>
          Hepsi
        </button>
        <button onClick={() => setActivity("mine")} className={pillBtn(activity === "mine")}>
          Benim
        </button>
        <button onClick={() => setActivity("friend")} className={pillBtn(activity === "friend")}>
          Arkadaş
        </button>
        <button onClick={() => setActivity("both")} className={pillBtn(activity === "both")}>
          İkisi de
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <p className="text-sm text-ink-muted">Bu filtrelerle eşleşen fırsat yok.</p>
        )}
        {visible.map((item) => (
          <OpportunityCard key={item.id} item={item} />
        ))}
      </div>

      {visibleCount < filtered.length && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="btn-ghost rounded-full"
          >
            Daha fazla göster ({filtered.length - visibleCount})
          </button>
        </div>
      )}
    </div>
  );
}
