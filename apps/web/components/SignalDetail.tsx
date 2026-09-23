"use client";

import type { CardView } from "../lib/card-view";
import { BAND, CONFIDENCE_LABEL } from "./card-visuals";
import { DecisionButtons, type Decision } from "./DecisionButtons";
import { TaskList } from "./TaskList";
import { formatSource } from "../lib/source-labels";
import { whyLine, trustNote, competitionNote } from "../lib/card-text";

const VERDICT_TR = { pursue: "kovala", watch: "izle", kill: "ele" } as const;

/**
 * Tek bir sinyalin sade ayrıntısı — Tüm sinyaller ve Panom paylaşır. Üstte karar için gereken
 * her şey (başlık, tek cümlelik neden, güven notu, karar düğmeleri); tam analiz (mercek
 * gerekçeleri, riskler, doğrulanacaklar, Yorumcu özeti) katlanır <details> içinde. Kovala ise
 * checklist altta.
 */
export function SignalDetail({
  card,
  meName,
  onDecided,
}: {
  card: CardView;
  meName: string;
  onDecided?: (d: Decision) => void;
}) {
  const band = BAND[card.gatedBand];
  const decided = card.finalDecision ?? card.mine;
  const risks = card.lensViews.flatMap((l) => l.risks).slice(0, 4);
  const verify = card.lensViews.flatMap((l) => l.validation_needed).slice(0, 4);
  const yorumcu = card.debates[0];
  const comp = competitionNote(card);

  return (
    <article className="space-y-4">
      <header>
        <h2 className="font-display text-xl font-semibold leading-snug">{card.title}</h2>
        <p className="mt-1 font-mono text-[11px] text-ink-muted">
          {formatSource(card.source)}
          {card.sector && ` · ${card.sector}`}
          {card.market && ` · ${card.market}`}
          {` · `}
          <span className={band.text}>{band.label.toLowerCase()}</span>
          {` · uyum ${card.fit} · ${trustNote(card)}`}
          {comp && ` · ${comp}`}
        </p>
      </header>

      <p className="text-[15px] leading-relaxed text-ink">{whyLine(card)}</p>
      {card.pitch && <p className="text-sm text-ink-secondary">{card.pitch}</p>}

      {card.facts.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {card.facts.map((f, i) => (
            <li key={i} className="rounded-btn border border-hair bg-surface px-2 py-0.5 text-[11px] text-ink-secondary">
              {f.text}
            </li>
          ))}
        </ul>
      )}

      <DecisionButtons signalId={card.id} mine={card.mine} onDecided={onDecided} />
      {card.finalDecision && (
        <p className="text-xs text-ink-muted">
          Ekip kararı: {VERDICT_TR[card.finalDecision]}
          {card.finalDecidedBy && ` (${card.finalDecidedBy})`}
          {card.finalReason && ` — ${card.finalReason}`}
        </p>
      )}

      <details className="rounded-card border border-hair bg-surface px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none text-ink-secondary">Tam analiz</summary>
        <div className="mt-3 space-y-4">
          {card.lensViews.map((l) => (
            <section key={l.id}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                {l.name} · {l.fit} · güven {CONFIDENCE_LABEL[l.confidence]}
              </h3>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-secondary">
                {l.rationale.replace(/^\[[^\]]*\]\s*/, "")}
              </p>
              {l.note && (
                <p className="mt-1 text-xs text-ink-muted">
                  {l.extraNoteLabel}: {l.note}
                </p>
              )}
            </section>
          ))}
          {risks.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Riskler</h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-secondary">
                {risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {verify.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Doğrulanacaklar</h3>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-secondary">
                {verify.map((v, i) => (
                  <li key={i}>
                    {v.data} <span className="text-ink-muted">— {v.how_to_verify}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {yorumcu && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Yorumcu · {VERDICT_TR[yorumcu.final_verdict]}
              </h3>
              <p className="mt-1 leading-relaxed text-ink-secondary">{yorumcu.final_commentary}</p>
            </section>
          )}
        </div>
      </details>

      {decided === "pursue" && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Sonraki adımlar</h3>
          <TaskList signalId={card.id} initial={card.tasks} meName={meName} canManage={card.isAdmin} />
        </section>
      )}

      <a href={card.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-brand hover:underline">
        Kaynağı aç →
      </a>
    </article>
  );
}
