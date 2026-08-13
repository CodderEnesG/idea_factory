"use client";

import { useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import { TaskList } from "./TaskList";
import { Comments } from "./Comments";
import { DebateRoom } from "./DebateRoom";
import { BAND } from "./card-visuals";

/**
 * Panom'un kartı (Faz 5.4) — OpportunityCard'ın küçültülmüş kopyası DEĞİL, ayrı bir amaç:
 * "AI seçti → sen karar verdin → yorum yapıldı → AI tartıştı → e şimdi ne olacak?" sorusuna
 * cevap. Üstte kısa bir "karar izi" (AI ne dedi, sen ne dedin, AI Yorumcusu ne dedi — tek
 * bakışta), altında HER ZAMAN açık görev listesi (Kuyruk'taki gibi `mine !== null` şartına
 * bağlı gösterilmiyor — Panom'da zaten hep var, gizlemenin anlamı yok). Analiz detayı/
 * yorumlar isteğe bağlı "Detaylar" ile açılır — burası tekrar analiz okumak için değil,
 * sonraki adımı atmak için.
 */
export function PanomCard({ item }: { item: CardView & { mine: Decision } }) {
  const [showDetail, setShowDetail] = useState(false);
  const band = BAND[item.band];
  const mineBand = BAND[item.mine];
  const debate = item.debates[0];

  return (
    <article
      className={`rounded-lg border border-white/[0.14] border-t-2 bg-white/[0.035] p-5 backdrop-blur-md transition hover:border-white/20 ${band.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate font-display text-base font-semibold text-ink hover:text-brand"
          >
            {item.title}
          </a>
          <div className="mt-1 text-xs text-ink-muted">
            {item.source}
            {item.sector && ` · ${item.sector}`}
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-ink-secondary">fit {item.fit}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs">
        <span className="text-ink-muted">AI:</span>
        <span className={`font-semibold ${band.text}`}>{band.label}</span>
        <span className="text-ink-muted">·</span>
        <span className="text-ink-muted">Sen:</span>
        <span className={`font-semibold ${mineBand.text}`}>{mineBand.label}</span>
        {item.band !== item.mine && (
          <span className="chip border-strong text-brand">AI&apos;dan farklı karar</span>
        )}
        {debate && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">AI Yorumcusu:</span>
            <span className={`font-semibold ${BAND[debate.final_verdict].text}`}>
              {BAND[debate.final_verdict].label}
            </span>
          </>
        )}
      </div>

      <div className="mt-4 rounded border border-white/[0.14] bg-elevated p-3">
        <TaskList signalId={item.id} initial={item.tasks} />
      </div>

      <button
        onClick={() => setShowDetail((v) => !v)}
        className="mt-3 text-xs font-medium text-brand hover:text-brand2"
      >
        {showDetail
          ? "Daralt ▴"
          : `Analiz ve yorumları${item.comments.length ? ` (${item.comments.length})` : ""} gör ▾`}
      </button>

      {showDetail && (
        <div className="mt-2">
          {item.summary && <p className="text-sm leading-relaxed text-ink-secondary">{item.summary}</p>}
          <Comments signalId={item.id} initial={item.comments} />
          {item.isAdmin && <DebateRoom signalId={item.id} initial={item.debates} />}
        </div>
      )}
    </article>
  );
}
