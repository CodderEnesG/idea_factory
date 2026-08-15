"use client";

import { useMemo, useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import type { SessionUser } from "../lib/session";
import { AppSidebar } from "./AppSidebar";
import { PanomCard } from "./PanomCard";
import { canonicalSourceName } from "../lib/source-health";
import { normalizeTag, distinct, distinctSources } from "../lib/facet-filters";
import { IconSearch } from "./icons";

type PanomItem = CardView & { mine: Decision };

const GROUPS: { d: Decision; label: string; dot: string; text: string }[] = [
  { d: "pursue", label: "Kovala", dot: "bg-pursue", text: "text-pursue" },
  { d: "watch", label: "İzle", dot: "bg-watch", text: "text-watch" },
  { d: "kill", label: "Ele", dot: "bg-kill", text: "text-kill" },
];

/**
 * Panom (Faz 5.1 + backlog #7): karar verilmiş sinyalleri Kovala/İzle/Ele'ye ayırıp gösterir.
 * Karar sayısı arttıkça Kuyruk'takine benzer bir arama/filtre şeridi gerekti — Kuyruk'un
 * tersine kenar çubuğuna gömülü değil, ana alanın üstünde tek satır (Panom'un liste alanı
 * zaten üç bölüme ayrılmış, kenar çubuğuna ikinci bir filtre kümesi sıkıştırmak yerine).
 */
export function PanomBoard({ cards, me }: { cards: PanomItem[]; me: SessionUser | null }) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [market, setMarket] = useState("");
  const [source, setSource] = useState("");

  const sectors = useMemo(() => distinct(cards, (i) => i.sector), [cards]);
  const markets = useMemo(() => distinct(cards, (i) => i.market), [cards]);
  const sources = useMemo(() => distinctSources(cards), [cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (sector && (!i.sector || normalizeTag(i.sector).key !== sector)) return false;
      if (market && (!i.market || normalizeTag(i.market).key !== market)) return false;
      if (source && canonicalSourceName(i.source) !== source) return false;
      return true;
    });
  }, [cards, search, sector, market, source]);

  const byBand = useMemo(() => {
    const map = new Map<Decision, PanomItem[]>();
    for (const g of GROUPS) map.set(g.d, []);
    for (const c of filtered) map.get(c.mine)?.push(c);
    return map;
  }, [filtered]);

  const activeFilterCount = (sector ? 1 : 0) + (market ? 1 : 0) + (source ? 1 : 0);

  function clearFilters() {
    setSector("");
    setMarket("");
    setSource("");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="panom" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-6">
            <h1 className="font-display text-3xl font-bold">Panom</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {cards.length} karar verilmiş sinyal · AI ne dedi, sen ne dedin, sırada ne var
            </p>
          </header>

          {cards.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Henüz bir karar vermediniz. Kuyruk&apos;ta bir sinyale Kovala, İzle ya da Ele deyin —
              burada kendi klasörüne düşsün.
            </p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center rounded-btn border border-hair bg-elevated">
                  <span className={`shrink-0 pl-2.5 ${search ? "text-ink" : "text-ink-muted"}`}>
                    <IconSearch className="h-3.5 w-3.5" />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setSearch("");
                    }}
                    placeholder="Ara…"
                    className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                </div>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="chip bg-surface">
                  <option value="">Sektör: Tümü</option>
                  {sectors.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select value={market} onChange={(e) => setMarket(e.target.value)} className="chip bg-surface">
                  <option value="">Pazar: Tümü</option>
                  {markets.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="chip bg-surface">
                  <option value="">Kaynak: Tümü</option>
                  {sources.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                    Temizle ({activeFilterCount})
                  </button>
                )}
                {(search || activeFilterCount > 0) && (
                  <span className="text-ink-muted">{filtered.length} sonuç</span>
                )}
              </div>

              {filtered.length === 0 && (
                <p className="text-sm text-ink-muted">Bu filtrelerle eşleşen karar yok.</p>
              )}

              <div className="space-y-10">
                {GROUPS.map((g) => {
                  const list = byBand.get(g.d) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <section key={g.d}>
                      <div className="mb-4 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${g.dot}`} />
                        <h2 className={`font-display text-lg font-semibold ${g.text}`}>{g.label}</h2>
                        <span className="text-sm text-ink-muted">({list.length})</span>
                      </div>
                      <div className="space-y-4">
                        {list.map((item) => (
                          <PanomCard key={item.id} item={item} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
