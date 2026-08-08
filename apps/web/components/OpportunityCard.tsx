"use client";

import { useState } from "react";
import type { CardView } from "../lib/card-view";
import { DecisionButtons } from "./DecisionButtons";
import { Comments } from "./Comments";
import { DebateRoom } from "./DebateRoom";

const BAND = {
  pursue: { label: "KOVALA", text: "text-pursue", dot: "bg-pursue", border: "border-t-pursue", hex: "#0ca30c" },
  watch: { label: "İZLE", text: "text-watch", dot: "bg-watch", border: "border-t-watch", hex: "#fab219" },
  kill: { label: "ELE", text: "text-kill", dot: "bg-kill", border: "border-t-kill", hex: "#d03b3b" },
} as const;

function FitRing({ fit, hex }: { fit: number; hex: string }) {
  return (
    <div
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${hex} ${fit}%, rgba(247,246,251,0.1) 0)` }}
    >
      <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-elevated font-display text-[11px] font-bold">
        {fit}
      </div>
    </div>
  );
}

export function OpportunityCard({ item }: { item: CardView }) {
  const [expanded, setExpanded] = useState(false);
  const band = BAND[item.band];
  const hasDetail = !item.noData && item.lensViews.length > 0;

  return (
    <article className={`glass border-t-2 p-6 ${band.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <FitRing fit={item.fit} hex={band.hex} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${band.text}`}>
                <span className={`h-2 w-2 rounded-full ${band.dot}`} /> {band.label}
              </span>
              <span className="text-ink-muted">·</span>
              <span className="text-ink-secondary">güven: {item.confidence}</span>
              {item.bench && (
                <>
                  <span className="text-ink-muted">·</span>
                  <span className="text-brand" title="Bench çıtası: fit ≥ 80 · güven yüksek">
                    🏅 bench
                  </span>
                </>
              )}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block truncate font-display text-lg font-semibold text-ink hover:text-brand"
            >
              {item.title}
            </a>
            <div className="mt-1 text-xs text-ink-muted">
              {item.source}
              {item.kindLabel && <> · {item.kindLabel}</>}
              {item.market && <> · {item.market}</>}
              {item.sector && <> · {item.sector}</>}
              {!item.noData && !item.fetchOk && <span className="ml-2 opacity-70">· sayfa çekilemedi</span>}
            </div>
          </div>
        </div>
        {item.pending && !item.notActionable && (
          <span className="chip shrink-0 border-strong text-brand">🔎 doğrulama bekliyor</span>
        )}
      </div>

      {item.facts.length > 0 && <div className="mt-3 text-xs text-ink-secondary">{item.facts.join(" · ")}</div>}

      {(item.notActionable || item.noData) && (
        <div className="mt-4 rounded-btn border border-hair bg-elevated px-3 py-2 text-xs text-ink-secondary">
          {item.notActionable ? (
            <>
              <span className="text-ink">Karar verilecek teşebbüs yok</span> — bu bir{" "}
              {item.kindLabel}. Arkasında şirket/ürün/yatırım turu olmadığı için kovalanamaz;
              fikir olarak değerliyse tez notlarına geçir.
            </>
          ) : (
            <>
              <span className="text-ink">Yetersiz veri</span> — sinyal henüz zenginleştirilmedi,
              ne yaptığı ve hangi problemi çözdüğü bilinmiyor. Karar vermeden önce{" "}
              <code>pnpm enrich</code> çalıştır.
            </>
          )}
        </div>
      )}

      {item.summary && (
        <p className={`mt-4 text-sm leading-relaxed text-ink ${expanded ? "" : "line-clamp-2"}`}>
          {item.summary}
        </p>
      )}

      {hasDetail && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-brand hover:text-brand2"
        >
          {expanded
            ? "Daralt ▴"
            : `Detayları${item.comments.length ? ` ve yorumları (${item.comments.length})` : ""} gör ▾`}
        </button>
      )}

      {expanded && (
        <div className="mt-2">
          {item.lensViews.map((lens, i) => (
            <div key={lens.id} className={i > 0 ? "mt-4 border-t border-hair pt-4" : "mt-4"}>
              {item.lensViews.length > 1 && (
                <div className="text-xs font-medium text-ink-muted">
                  {lens.name} · fit {lens.fit} · güven: {lens.confidence}
                </div>
              )}
              <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{lens.rationale}</p>

              {lens.note && (
                <p className="mt-2 text-sm text-ink-secondary">
                  <span className="text-ink-muted">{lens.extraNoteLabel}: </span>
                  {lens.note}
                </p>
              )}

              {lens.risks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {lens.risks.map((r, ri) => (
                    <span key={ri} className="chip">
                      ⚠ {r}
                    </span>
                  ))}
                </div>
              )}

              {lens.validation_needed.length > 0 && (
                <div className="mt-3 rounded-btn border border-hair bg-elevated p-3">
                  <div className="text-xs font-medium text-brand">Doğrulama görevleri</div>
                  <ul className="mt-2 space-y-1.5">
                    {lens.validation_needed.map((v, vi) => (
                      <li key={vi} className="text-xs text-ink-secondary">
                        <span className="text-ink">{v.data}</span> — {v.why}{" "}
                        <span className="text-ink-muted">(nasıl: {v.how_to_verify})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <Comments signalId={item.id} initial={item.comments} />

          {item.isAdmin && <DebateRoom signalId={item.id} initial={item.debates} />}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <DecisionButtons signalId={item.id} mine={item.mine} others={item.others} />
        {!expanded && item.comments.length > 0 && (
          <span className="shrink-0 text-xs text-ink-muted">💬 {item.comments.length}</span>
        )}
      </div>
    </article>
  );
}
