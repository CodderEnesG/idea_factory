"use client";

import { useEffect, useRef, useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision, UserDecision } from "./DecisionButtons";
import { DecisionButtons } from "./DecisionButtons";
import { useComments } from "./Comments";
import { CommentFeed } from "./CommentFeed";
import { useDebate, DebateFeed } from "./DebateRoom";
import { TaskList } from "./TaskList";
import { BAND, FitRing, CONFIDENCE_LABEL } from "./card-visuals";
import { formatSource } from "../lib/source-labels";
import { OpportunityMenu } from "./OpportunityMenu";
import {
  IconAlertTriangle,
  IconAward,
  IconBanknote,
  IconGlobe,
  IconLock,
  IconMessage,
  IconSearch,
  IconSparkle,
  IconTrendingUp,
  IconUsers,
} from "./icons";
import type { FactKind } from "../lib/card-view";

const KEY_TO_DECISION: Record<string, Decision> = { "1": "pursue", "2": "watch", "3": "kill" };

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

const FACT_ICON: Partial<Record<FactKind, (props: { className?: string }) => JSX.Element>> = {
  geo: IconGlobe,
  funding: IconBanknote,
  users: IconUsers,
  traction: IconTrendingUp,
};

/**
 * Kuyruk'un sağ paneli (Faz 5.7) — sabit bağlam başlığı (sürüklenemez, tek satır özet) →
 * kayan mesaj akışı (AI analizi + görev listesi + yorumlar + AI Yorumcusu turları) → sabit
 * alt bar: karar butonları + yorum/AI Yorumcusu daire butonları (kullanıcı isteği:
 * "kaydırılabilir olmamalı", "daha sade", "kovala izle ele aşağı", "yorum daire buton,
 * tıklanınca açılsın"). 1/2/3 tuşlarıyla da karar verilir.
 */
export function DetailPanel({
  item,
  meName,
  onDecided,
  onFinalized,
  onSkip,
}: {
  item: CardView;
  meName: string;
  onDecided: (d: Decision) => void;
  onFinalized: (f: { decision: Decision; decidedBy: string } | null) => void;
  onSkip?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const band = BAND[item.band];
  const hasDetail = !item.noData && item.lensViews.length > 0;
  const comments = useComments(item.id, item.comments);
  const debate = useDebate(item.id, item.debates);
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);

  // Kesinleşmiş karar (0013, problem 1/2) — herhangi bir üye kilitleyebilir/açabilir.
  // Kilitleme, o an ekranda görünen AI bandını DEĞİL, kendi kararını (`item.mine`) esas alır
  // — Panom'daki "sürüklenen sütun kilitlenir" mantığıyla aynı: kilitlemeden önce bir karar
  // vermiş olman gerekir.
  async function toggleFinal() {
    setLockBusy(true);
    try {
      if (item.finalDecision !== null) {
        const res = await fetch("/api/decisions/final", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signal_id: item.id }),
        });
        if (res.ok) onFinalized(null);
      } else if (item.mine !== null) {
        const res = await fetch("/api/decisions/final", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signal_id: item.id, decision: item.mine }),
        });
        if (res.ok) onFinalized({ decision: item.mine, decidedBy: meName });
      }
    } finally {
      setLockBusy(false);
    }
  }

  // Kullanıcı isteği: "yapay zekadan çıkan sonuçta ekip kısmına kaydedilsin" — AI
  // Yorumcusu'nun en son turunun nihai kararı da karar butonlarının altındaki "ekip:"
  // satırında bir üye gibi görünsün. Yalnız görüntüleme amaçlı birleştirme — `item.others`
  // (gerçek kullanıcı kararları) değişmiyor, en son tartışma yoksa (admin değil veya hiç
  // başlatılmamışsa `debate.debates` zaten boş) hiçbir şey eklenmiyor.
  const latestDebate = debate.debates[0];
  const teamWithAi: UserDecision[] = latestDebate
    ? [...item.others, { user: "AI Yorumcusu", decision: latestDebate.final_verdict }]
    : item.others;

  useEffect(() => {
    if (composerOpen) commentInputRef.current?.focus();
  }, [composerOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target;
      if (target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      const decision = KEY_TO_DECISION[e.key];
      if (decision) {
        rootRef.current?.querySelector<HTMLButtonElement>(`[data-decision="${decision}"]`)?.click();
      } else if (e.key === "ArrowRight" && onSkip) {
        onSkip();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSkip]);

  return (
    // `key`: her sinyal geçişinde tam remount — DecisionButtons'ın iç `chosen` state'i
    // bir önceki sinyalden sızmasın (aynı ağaç konumunda kalıp yalnız prop değişseydi
    // React state'i taşırdı — bu bug'ı daha önce bulup baştan önledik).
    <div key={item.id} ref={rootRef} className="flex h-full flex-col">
      {/* ── sabit bağlam başlığı (sürüklenemez, sade, ortalanmış) ── */}
      <div className="shrink-0 border-b border-white/[0.14] bg-surface px-5 py-3.5">
        <div className="mx-auto flex max-w-3xl items-start gap-3">
          <FitRing fit={item.fit} hex={band.hex} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block min-w-0 flex-1 truncate font-display text-base font-semibold text-ink hover:text-brand"
              >
                {item.title}
              </a>
              <span className="group relative inline-flex shrink-0 items-center">
                <button
                  type="button"
                  aria-label="Kaynak, tür, pazar, sektör"
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-hair text-[10px] leading-none text-ink-muted transition hover:border-strong hover:text-ink"
                >
                  i
                </button>
                <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded-btn border border-hair bg-elevated px-2.5 py-1.5 text-xs text-ink-secondary shadow-lg group-hover:block">
                  {formatSource(item.source)}
                  {item.kindLabel && <> · {item.kindLabel}</>}
                  {item.market && <> · {item.market}</>}
                  {item.sector && <> · {item.sector}</>}
                </span>
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-xs text-ink-muted">
              <span className={`inline-flex items-center gap-1 ${band.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} /> {band.label}
              </span>
              <span>· güven: {CONFIDENCE_LABEL[item.confidence]}</span>
              {item.finalDecision !== null && (
                <span className="inline-flex items-center gap-1 text-brand" title={`Kilitleyen: ${item.finalDecidedBy}`}>
                  · <IconLock className="h-3 w-3" /> Kesinleşti: {BAND[item.finalDecision].label} ({item.finalDecidedBy})
                </span>
              )}
              {item.bench && (
                <span className="inline-flex items-center gap-1 text-brand">
                  · <IconAward className="h-3 w-3" /> bench
                </span>
              )}
              {item.pending && !item.notActionable && (
                <span className="inline-flex items-center gap-1 text-brand">
                  · <IconSearch className="h-3 w-3" /> doğrulama bekliyor
                </span>
              )}
              {!item.noData && !item.fetchOk && <span className="opacity-70">· sayfa çekilemedi</span>}
              {teamWithAi.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  ·
                  <span className="inline-flex -space-x-1">
                    {teamWithAi.map((o) => (
                      <span
                        key={o.user}
                        title={`${o.user}: ${BAND[o.decision].label}`}
                        className={`grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold text-white ring-1 ring-surface ${BAND[o.decision].dot}`}
                      >
                        {initialsOf(o.user)}
                      </span>
                    ))}
                  </span>
                </span>
              )}
            </div>
          </div>
          <OpportunityMenu url={item.url} onSkip={onSkip} />
        </div>
      </div>

      {/* ── kayan mesaj akışı ── kaydırılan içerik üst bağlam başlığına/alt karar barına
          yaklaşınca sert bir çizgide kesilmek yerine mask-image ile yumuşak solarak
          kayboluyor (kullanıcı isteği: "kovala izle ele alt navbar'a doğru yumuşayarak
          kaybolma", aynısı üst başlık için de). */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)] [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-lg border border-white/[0.14] bg-white/[0.035] p-4">
            {item.facts.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-secondary">
                {item.facts.map((f, i) => {
                  const FactIcon = FACT_ICON[f.kind];
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5">
                      {FactIcon && <FactIcon className="h-3 w-3 shrink-0 text-ink-muted" />}
                      {f.text}
                    </span>
                  );
                })}
              </div>
            )}

            {(item.notActionable || item.noData) && (
              <div
                className={`rounded-btn border border-hair bg-elevated px-3 py-2 text-xs text-ink-secondary ${item.facts.length > 0 ? "mt-3" : ""}`}
              >
                {item.notActionable ? (
                  <>
                    <span className="text-ink">Karar verilecek teşebbüs yok</span> — bu bir{" "}
                    {item.kindLabel}. Arkasında şirket/ürün/yatırım turu olmadığı için
                    kovalanamaz; fikir olarak değerliyse tez notlarına geçir.
                  </>
                ) : (
                  <>
                    <span className="text-ink">Yetersiz veri</span> — sinyal henüz
                    zenginleştirilmedi, ne yaptığı ve hangi problemi çözdüğü bilinmiyor. Karar
                    vermeden önce <code>pnpm enrich</code> çalıştır.
                  </>
                )}
              </div>
            )}

            {item.summary && (
              <p className={`text-sm leading-relaxed text-ink ${item.facts.length > 0 || item.notActionable || item.noData ? "mt-3" : ""}`}>
                {item.summary}
              </p>
            )}

            {hasDetail && (
              <div className={item.summary || item.facts.length > 0 ? "mt-3" : ""}>
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  {detailsOpen ? "Analizi gizle ▴" : "Analizi göster ▾"}
                </button>

                {detailsOpen && (
                  <div className="mt-3">
                    {item.lensViews.map((lens, i) => (
                      <div key={lens.id} className={i > 0 ? "mt-4 border-t border-hair pt-4" : ""}>
                        {item.lensViews.length > 1 && (
                          <div className="font-mono text-xs font-medium text-ink-muted">
                            {lens.name} · fit {lens.fit} · güven: {CONFIDENCE_LABEL[lens.confidence]}
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
                              <span key={ri} className="chip gap-1.5">
                                <IconAlertTriangle className="h-3 w-3 shrink-0" /> {r}
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
                  </div>
                )}
              </div>
            )}
          </div>

          {item.mine !== null && (
            <div className="rounded-lg border border-white/[0.14] bg-elevated p-3.5">
              <TaskList signalId={item.id} initial={item.tasks} />
            </div>
          )}

          <CommentFeed items={comments.items} />

          {item.isAdmin && (
            <DebateFeed debates={debate.debates} progress={debate.progress} error={debate.error} />
          )}
        </div>
      </div>

      {/* ── sabit alt bar: karar + yorum/AI daire butonları (ortalanmış) ── */}
      <div className="shrink-0 border-t border-white/[0.14] bg-surface px-5 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <DecisionButtons signalId={item.id} mine={item.mine} onDecided={onDecided} />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {(item.finalDecision !== null || item.mine !== null) && (
                <button
                  onClick={toggleFinal}
                  disabled={lockBusy}
                  title={
                    item.finalDecision !== null
                      ? "Ekip kararı kilidini aç"
                      : "Kendi kararını ekip kararı olarak kilitle"
                  }
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition disabled:opacity-50 ${
                    item.finalDecision !== null
                      ? "border-strong bg-white/[0.06] text-brand"
                      : "border-hair bg-elevated text-ink-secondary hover:border-strong hover:text-ink"
                  }`}
                >
                  <IconLock className="h-4 w-4" />
                </button>
              )}
              {item.isAdmin && (
                <button
                  onClick={debate.start}
                  disabled={debate.busy}
                  title="AI Yorumcusu başlat — çok ajanlı tartışma"
                  aria-label="AI Yorumcusu başlat"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-base text-white transition hover:shadow-brand disabled:opacity-50"
                >
                  {debate.busy ? "…" : <IconSparkle className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={() => setComposerOpen((v) => !v)}
                title="Yorum ekle"
                aria-label="Yorum ekle"
                className={`grid h-10 w-10 place-items-center rounded-full border transition ${
                  composerOpen
                    ? "border-strong bg-white/[0.06] text-ink"
                    : "border-hair bg-elevated text-ink-secondary hover:border-strong hover:text-ink"
                }`}
              >
                <IconMessage className="h-4 w-4" />
              </button>
            </div>
          </div>

          {composerOpen && (
            <div className="mt-3 flex items-center gap-2">
              <input
                ref={commentInputRef}
                value={comments.text}
                onChange={(e) => comments.setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    comments.add();
                  }
                }}
                placeholder="Yorum yaz…"
                className="min-w-0 flex-1 rounded border border-white/[0.14] bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                onClick={comments.add}
                disabled={comments.busy || !comments.text.trim()}
                className="btn-primary shrink-0 rounded px-4 py-2 text-sm disabled:opacity-50"
              >
                Gönder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
