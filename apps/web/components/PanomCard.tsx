"use client";

import { useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import { TaskList } from "./TaskList";
import { Comments } from "./Comments";
import { DebateRoom } from "./DebateRoom";
import { BAND } from "./card-visuals";
import { formatSource } from "../lib/source-labels";
import { OpportunityMenu } from "./OpportunityMenu";
import { IconLock } from "./icons";

const BORDER_BY_BAND: Record<Decision, string> = {
  pursue: "border-l-pursue",
  watch: "border-l-watch",
  kill: "border-l-kill",
};

/**
 * Panom'un kanban kartı (0013 yeniden tasarımı — bkz. PanomBoard.tsx). Eski tam-genişlik
 * "her şey hep açık" karttan farklı: kanban sütunu dar, çok kart yan yana taranacak — bu
 * yüzden varsayılan KOMPAKT (başlık/kaynak/bant/kilit), analiz/yorum/görev "Detay" ile açılır.
 * Kilitli (final karar) kartlar SÜRÜKLENEMEZ — önce kilit açılmalı (yanlışlıkla ekip kararını
 * bozmasın diye kasıtlı sürtünme).
 */
export function PanomCard({
  item,
  effective,
  locked,
  lockedBy,
  onLock,
  onUnlock,
}: {
  item: CardView;
  effective: Decision;
  locked: boolean;
  lockedBy: string | null;
  onLock: () => void;
  onUnlock: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const band = BAND[item.band];
  const mineBand = item.mine ? BAND[item.mine] : null;
  const debate = item.debates[0];
  const doneTasks = item.tasks.filter((t) => t.done).length;

  function onDragStart(e: React.DragEvent<HTMLElement>) {
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <article
      draggable={!locked}
      onDragStart={onDragStart}
      className={`rounded-lg border border-l-[3px] ${BORDER_BY_BAND[effective]} border-white/[0.14] bg-white/[0.035] p-3.5 backdrop-blur-md transition hover:border-white/20 ${
        locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            draggable={false}
            className="block truncate font-display text-sm font-semibold text-ink hover:text-brand"
          >
            {item.title}
          </a>
          <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-muted">
            {formatSource(item.source)}
            {item.sector && ` · ${item.sector}`}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            title="AI fit skoru — Sen/Yorumcu kararı farklıysa sütun yerleşimi onlara göredir"
            className="font-mono text-xs text-ink-secondary"
          >
            {item.fit}
          </span>
          <OpportunityMenu url={item.url} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1 font-mono text-[10.5px]">
        <span className="text-ink-muted">AI:</span>
        <span className={`font-semibold ${band.text}`}>{band.label}</span>
        {mineBand && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">Sen:</span>
            <span className={`font-semibold ${mineBand.text}`}>{mineBand.label}</span>
          </>
        )}
        {debate && (
          <>
            <span className="text-ink-muted">·</span>
            <span className={`font-semibold ${BAND[debate.final_verdict].text}`}>
              Yorumcu: {BAND[debate.final_verdict].label}
            </span>
          </>
        )}
        {item.tasks.length > 0 && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-muted">
              görev {doneTasks}/{item.tasks.length}
            </span>
          </>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        {locked ? (
          <button
            onClick={onUnlock}
            title={`Kilidi aç (kilitleyen: ${lockedBy})`}
            className="chip gap-1 border-strong text-brand"
          >
            <IconLock className="h-3 w-3" /> Kesinleşti · {lockedBy}
          </button>
        ) : (
          <button onClick={onLock} title="Bu bandı ekip kararı olarak kilitle" className="chip gap-1 text-ink-muted hover:border-strong hover:text-ink">
            <IconLock className="h-3 w-3" /> Kilitle
          </button>
        )}
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="text-[11px] font-medium text-brand hover:text-brand2"
        >
          {showDetail ? "Daralt ▴" : `Detay${item.comments.length ? ` (${item.comments.length})` : ""} ▾`}
        </button>
      </div>

      {showDetail && (
        <div className="mt-3 space-y-3 border-t border-white/[0.14] pt-3">
          {item.summary && <p className="text-xs leading-relaxed text-ink-secondary">{item.summary}</p>}
          <div className="rounded border border-white/[0.14] bg-elevated p-3">
            <TaskList signalId={item.id} initial={item.tasks} />
          </div>
          <Comments signalId={item.id} initial={item.comments} />
          {item.isAdmin && <DebateRoom signalId={item.id} initial={item.debates} />}
        </div>
      )}
    </article>
  );
}
