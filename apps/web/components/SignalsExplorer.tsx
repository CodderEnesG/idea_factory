"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Band, CardView } from "../lib/card-view";
import type { SessionUser } from "../lib/session";
import { AppSidebar } from "./AppSidebar";
import { SignalDetail } from "./SignalDetail";
import { BAND } from "./card-visuals";
import { formatSource } from "../lib/source-labels";

export interface ExplorerRow {
  id: string;
  title: string;
  source: string;
  sector: string | null;
  fit: number;
  gatedBand: Band;
  decided: Band | null;
}

export interface ExplorerFilters {
  q: string;
  band: Band | "";
  karar: "" | "kararsiz" | "kararli";
  kaynak: string;
}

const BANDS: Band[] = ["pursue", "watch", "kill"];
const DECISION_MARK: Record<Band, string> = { pursue: "K", watch: "İ", kill: "E" };

function buildHref(f: ExplorerFilters, page: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.band) p.set("band", f.band);
  if (f.karar) p.set("karar", f.karar);
  if (f.kaynak) p.set("kaynak", f.kaynak);
  if (page > 1) p.set("sayfa", String(page));
  const qs = p.toString();
  return qs ? `/queue?${qs}` : "/queue";
}

/**
 * Tüm sinyaller — baştan yazıldı (2026-09-24). Tek sıralı liste + sağda sade ayrıntı. Filtre çubuğu
 * yalnız dört şey: arama, bant, karar durumu, kaynak. Süzme ve sayfalama sunucuda (URL parametresi);
 * yalnız görünen sayfanın kartları çekildiği için sayfa açılışı ~1 sn'dir.
 */
export function SignalsExplorer({
  rows,
  cards,
  total,
  page,
  pageCount,
  counts,
  sources,
  filters,
  initialId,
  me,
  meName,
  demo,
  loadError,
}: {
  rows: ExplorerRow[];
  cards: Record<string, CardView>;
  total: number;
  page: number;
  pageCount: number;
  counts: Record<Band, number>;
  sources: { key: string; count: number }[];
  filters: ExplorerFilters;
  initialId: string | null;
  me: SessionUser | null;
  meName: string;
  demo: boolean;
  loadError: string | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? rows[0]?.id ?? null);
  const [search, setSearch] = useState(filters.q);
  const selected = selectedId ? cards[selectedId] : undefined;

  function go(next: Partial<ExplorerFilters>) {
    router.push(buildHref({ ...filters, ...next }, 1));
  }
  function onSearch(e: FormEvent) {
    e.preventDefault();
    go({ q: search.trim() });
  }

  const chip = (active: boolean) =>
    `rounded-btn px-2.5 py-1 text-xs transition ${
      active ? "bg-white/[0.09] text-ink" : "text-ink-muted hover:bg-white/[0.04] hover:text-ink"
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="queue" />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 md:pt-8">
          <header className="mb-4">
            <h1 className="font-display text-3xl font-bold">Tüm sinyaller</h1>
            <p className="mt-1 text-sm text-ink-secondary">{total} sinyal, en umut vericiden başlayarak</p>
          </header>

          {demo && (
            <p className="mb-4 rounded-btn border border-hair bg-surface px-3 py-2 text-xs text-ink-muted">
              Demo verisi gösteriliyor, kararlar kaydedilmez.
            </p>
          )}
          {loadError && <p className="mb-4 text-sm text-kill">Veri yüklenemedi: {loadError}</p>}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <form onSubmit={onSearch} className="min-w-[200px] flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Başlıkta ara…"
                aria-label="Başlıkta ara"
                className="w-full rounded-btn border border-hair bg-elevated px-3 py-1.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand"
              />
            </form>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => go({ band: "" })} className={chip(filters.band === "")}>
                Hepsi
              </button>
              {BANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => go({ band: filters.band === b ? "" : b })}
                  className={chip(filters.band === b)}
                >
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${BAND[b].dot}`} />
                  {BAND[b].label.charAt(0) + BAND[b].label.slice(1).toLowerCase()} {counts[b]}
                </button>
              ))}
            </div>
            <select
              value={filters.karar}
              onChange={(e) => go({ karar: e.target.value as ExplorerFilters["karar"] })}
              aria-label="Karar durumu"
              className="rounded-btn border border-hair bg-elevated px-2 py-1.5 text-xs text-ink-secondary"
            >
              <option value="">Karar: hepsi</option>
              <option value="kararsiz">Yalnız kararsızlar</option>
              <option value="kararli">Yalnız kararlılar</option>
            </select>
            <select
              value={filters.kaynak}
              onChange={(e) => go({ kaynak: e.target.value })}
              aria-label="Kaynak"
              className="max-w-[170px] rounded-btn border border-hair bg-elevated px-2 py-1.5 text-xs text-ink-secondary"
            >
              <option value="">Kaynak: hepsi</option>
              {sources.map((s) => (
                <option key={s.key} value={s.key}>
                  {formatSource(s.key)} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {rows.length === 0 ? (
            <div className="glass p-8 text-center text-sm text-ink-secondary">Bu süzgeçle eşleşen sinyal yok.</div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="min-w-0 lg:w-[44%] lg:shrink-0">
                <ol className="divide-y divide-white/[0.06] overflow-hidden rounded-card border border-hair bg-surface">
                  {rows.map((r) => {
                    const b = BAND[r.gatedBand];
                    const active = r.id === selectedId;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(r.id)}
                          aria-current={active}
                          className={`flex w-full items-start gap-3 border-l-[3px] px-3 py-2.5 text-left transition ${
                            active ? "border-l-brand bg-white/[0.05]" : "border-l-transparent hover:bg-white/[0.025]"
                          }`}
                        >
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${b.dot}`} title={b.label} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] text-ink">{r.title}</span>
                            <span className="block truncate font-mono text-[10.5px] text-ink-muted">
                              {formatSource(r.source)}
                              {r.sector && ` · ${r.sector}`}
                            </span>
                          </span>
                          {r.decided && (
                            <span
                              title={`Karar: ${BAND[r.decided].label.toLowerCase()}`}
                              className={`font-mono text-[10px] font-bold ${BAND[r.decided].text}`}
                            >
                              {DECISION_MARK[r.decided]}
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-ink-muted">{r.fit}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                {pageCount > 1 && (
                  <nav className="mt-3 flex items-center justify-between text-xs text-ink-secondary" aria-label="Sayfalar">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => router.push(buildHref(filters, page - 1))}
                      className="rounded-btn px-3 py-1.5 hover:bg-white/[0.05] disabled:opacity-30"
                    >
                      ← Önceki
                    </button>
                    <span>
                      {page} / {pageCount}
                    </span>
                    <button
                      type="button"
                      disabled={page >= pageCount}
                      onClick={() => router.push(buildHref(filters, page + 1))}
                      className="rounded-btn px-3 py-1.5 hover:bg-white/[0.05] disabled:opacity-30"
                    >
                      Sonraki →
                    </button>
                  </nav>
                )}
              </div>

              <section key={selectedId} className="glass min-w-0 flex-1 p-5 lg:sticky lg:top-8 lg:self-start">
                {selected ? (
                  <SignalDetail card={selected} meName={meName} />
                ) : (
                  <p className="text-sm text-ink-muted">Ayrıntı için soldan bir sinyal seç.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
