"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import { BAND } from "./card-visuals";
import { whyLine, trustNote, competitionNote } from "../lib/card-text";
import { formatSource } from "../lib/source-labels";
import { AppSidebar, type NavKey } from "./AppSidebar";
import type { SessionUser } from "../lib/session";

/**
 * Gelen kutusu — Linear "Triage" deseni: TEK sıralı liste, her satırda tek cümlelik "neden",
 * tek tuşla karar (1 Kovala · 2 İzle · 3 Ele), karar verilen satır listeden düşer, imleç
 * bir sonrakine geçer. Yargıç/veto/guard/Yorumcu mekaniği görünmez: kullanıcı yalnız
 * "neden bu?" cümlesini ve tek kelimelik güven notunu görür. Hiçbir sinyal gizlice
 * elenmez — sistemin "ele" dediği sinyaller listede değil, sayaçta ve Kuyruk'ta durur.
 */

const OPTS: { d: Decision; key: string; label: string; cls: string }[] = [
  { d: "pursue", key: "1", label: "Kovala", cls: "bg-pursue/10 text-pursue hover:bg-pursue/25" },
  { d: "watch", key: "2", label: "İzle", cls: "bg-watch/10 text-watch hover:bg-watch/25" },
  { d: "kill", key: "3", label: "Ele", cls: "bg-kill/10 text-kill hover:bg-kill/25" },
];

export function InboxBoard({
  items,
  hiddenKilled,
  decidedCount,
  me,
  demo,
  loadError,
  current: navKey = "gelen",
  title = "Gelen kutusu",
  metricById,
  note,
}: {
  items: CardView[];
  hiddenKilled: number;
  decidedCount: number;
  me: SessionUser | null;
  demo: boolean;
  loadError: string | null;
  /** Aynı triage başka listede (Kanıtlı gelir) kullanılınca menü anahtarı ve başlık. */
  current?: NavKey;
  title?: string;
  /** Satır başına kısa kaynak metriği ("30g $85.9K ↑12%"); verilirse uyum puanının yanında görünür. */
  metricById?: Record<string, string>;
  /** Başlığın altında tek satır bilgi notu. */
  note?: string | null;
}) {
  const [queue, setQueue] = useState(items);
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = queue[cursor] ?? null;

  const decide = useCallback(
    async (d: Decision) => {
      const target = queue[cursor];
      if (!target) return;
      setError(null);
      // İyimser: satır hemen düşer, imleç aynı indekste (yani bir sonrakinde) kalır.
      setQueue((q) => q.filter((x) => x.id !== target.id));
      setCursor((c) => Math.min(c, Math.max(0, queue.length - 2)));
      setDone((n) => n + 1);
      try {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signal_id: target.id, decision: d }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch {
        // Yazma başarısız: satırı geri koy, kullanıcı kararın kaydolmadığını görsün.
        setQueue((q) => {
          const next = [...q];
          next.splice(Math.min(cursor, next.length), 0, target);
          return next;
        });
        setDone((n) => n - 1);
        setError("Karar kaydedilemedi, bağlantını kontrol edip tekrar dene.");
      }
    },
    [queue, cursor],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(0, queue.length - 1)));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (e.key === "1") void decide("pursue");
      else if (e.key === "2") void decide("watch");
      else if (e.key === "3") void decide("kill");
      else if (e.key === "o" && queue[cursor]) window.open(queue[cursor].url, "_blank", "noopener");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, queue, cursor]);

  const remaining = queue.length;
  const heading = useMemo(
    () => (remaining > 0 ? `${remaining} fırsat karar bekliyor` : `${title} boş`),
    [remaining, title],
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current={navKey} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 md:pt-8">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                {heading}
                {done > 0 && ` · bu oturumda ${done} karar`}
              </p>
              {note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}
            </div>
            <p className="hidden font-mono text-[11px] text-ink-muted md:block">
              <kbd>j</kbd>/<kbd>k</kbd> gez · <kbd>1</kbd> kovala · <kbd>2</kbd> izle · <kbd>3</kbd> ele · <kbd>o</kbd> kaynağı aç
            </p>
          </header>

          {demo && (
            <p className="mb-4 rounded-btn border border-hair bg-surface px-3 py-2 text-xs text-ink-muted">
              Demo verisi gösteriliyor, kararlar kaydedilmez.
            </p>
          )}
          {loadError && <p className="mb-4 text-sm text-kill">Veri yüklenemedi: {loadError}</p>}
          {error && <p className="mb-4 text-sm text-kill">{error}</p>}

          {remaining === 0 ? (
            <div className="glass p-8 text-center text-sm text-ink-secondary">
              <p className="font-display text-lg text-ink">Hepsi bu kadar.</p>
              <p className="mt-2">
                Yeni fırsatlar günde iki kez gelir.
                {hiddenKilled > 0 && ` Sistem ${hiddenKilled} sinyali eledi; Kuyruk'ta görebilirsin.`}
                {decidedCount > 0 && ` ${decidedCount} kararın Panom'da.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              <ol className="min-w-0 flex-1 divide-y divide-white/[0.06] overflow-hidden rounded-card border border-hair bg-surface lg:max-w-[46%]">
                {queue.map((it, i) => {
                  const b = BAND[it.gatedBand];
                  const active = i === cursor;
                  return (
                    <li key={it.id}>
                      <button
                        type="button"
                        onClick={() => setCursor(i)}
                        aria-current={active}
                        className={`flex w-full items-start gap-3 border-l-[3px] px-3 py-2.5 text-left transition ${
                          active ? "border-l-brand bg-white/[0.05]" : "border-l-transparent hover:bg-white/[0.025]"
                        }`}
                      >
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${b.dot}`} title={b.label} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] text-ink">{it.title}</span>
                          <span className="block truncate font-mono text-[10.5px] text-ink-muted">
                            {formatSource(it.source)}
                            {it.sector && ` · ${it.sector}`}
                          </span>
                        </span>
                        {metricById?.[it.id] && (
                          <span className="shrink-0 font-mono text-[11px] text-pursue">{metricById[it.id]}</span>
                        )}
                        <span className="font-mono text-xs font-bold text-ink-muted">{it.fit}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {current && (
                <section
                  key={current.id}
                  className="glass min-w-0 flex-1 space-y-4 p-5 lg:sticky lg:top-8 lg:self-start"
                >
                  <div>
                    <h2 className="font-display text-xl font-semibold leading-snug">{current.title}</h2>
                    <p className="mt-1 font-mono text-[11px] text-ink-muted">
                      {formatSource(current.source)}
                      {metricById?.[current.id] && ` · ${metricById[current.id]}`} · {BAND[current.gatedBand].label.toLowerCase()} · uyum {current.fit} ·{" "}
                      {trustNote(current)}
                      {competitionNote(current) && ` · ${competitionNote(current)}`}
                    </p>
                  </div>

                  <p className="text-[15px] leading-relaxed text-ink">{whyLine(current)}</p>

                  {current.lensViews.some((l) => l.risks.length > 0) && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Dikkat</div>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-ink-secondary">
                        {current.lensViews
                          .flatMap((l) => l.risks)
                          .slice(0, 3)
                          .map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {OPTS.map((o) => (
                      <button
                        key={o.d}
                        type="button"
                        onClick={() => void decide(o.d)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition ${o.cls}`}
                      >
                        {o.label}
                        <kbd className="rounded bg-black/20 px-1.5 font-mono text-[10px] opacity-70">{o.key}</kbd>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <a
                      href={current.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      Kaynağı aç →
                    </a>
                    <a href={`/queue?id=${encodeURIComponent(current.id)}`} className="text-ink-secondary hover:text-ink hover:underline">
                      Tam analiz, tartışma ve notlar →
                    </a>
                  </div>
                </section>
              )}
            </div>
          )}

          {remaining > 0 && hiddenKilled > 0 && (
            <p className="mt-4 text-xs text-ink-muted">
              {hiddenKilled} sinyal sistem tarafından elendi ve burada gösterilmiyor. Kuyruk'ta duruyorlar.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
