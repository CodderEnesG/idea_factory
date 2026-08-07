import {
  composite,
  isActionableKind,
  isBench,
  lenses,
  StoredEnrichmentSchema,
  type RankedItem,
} from "@idea-factory/core";
import { DecisionButtons, type Decision, type UserDecision } from "./DecisionButtons";
import { Comments, type Comment } from "./Comments";

const KIND_LABEL = {
  venture: "girişim",
  product: "ürün",
  funding: "yatırım turu",
  essay: "görüş yazısı",
  research: "araştırma",
  other: "sınıflanmadı",
} as const;

const BAND = {
  pursue: { label: "KOVALA", text: "text-pursue", dot: "bg-pursue", ring: "border-l-pursue" },
  watch: { label: "İZLE", text: "text-watch", dot: "bg-watch", ring: "border-l-watch" },
  kill: { label: "ELE", text: "text-kill", dot: "bg-kill", ring: "border-l-kill" },
} as const;

export function OpportunityCard({
  item,
  mine = null,
  others = [],
  comments = [],
}: {
  item: RankedItem;
  mine?: Decision | null;
  others?: UserDecision[];
  comments?: Comment[];
}) {
  const { signal, analyses } = item;
  const comp = composite(analyses);
  const band = BAND[comp.band];
  const activeLenses = lenses.filter((l) => analyses[l.id]);
  const pending = Object.values(analyses).some((a) => a.validation_needed.length > 0);

  const enrParsed = StoredEnrichmentSchema.safeParse(
    (signal as { enrichment?: unknown }).enrichment,
  );
  const enr = enrParsed.success ? enrParsed.data : null;
  // Karar verilemez kart: ya hiç zenginleştirme yok, ya da ortada kovalanacak teşebbüs yok.
  // Sessizce "? · ?" gösterip kullanıcıyı karar vermeye zorlamak yerine sebebini söyle.
  // signal_kind null = legacy satır, sınıf bilinmiyor → kovalanamaz damgası vurma.
  const notActionable = enr?.signal_kind ? !isActionableKind(enr.signal_kind) : false;
  const noData = !enr;
  const facts: string[] = [];
  if (enr) {
    if (enr.hq_country) facts.push(`🌍 ${enr.hq_country}`);
    if (enr.markets.length) facts.push(enr.markets.join(", "));
    if (enr.funding.stage || enr.funding.amount)
      facts.push(`💰 ${[enr.funding.stage, enr.funding.amount].filter(Boolean).join(" ")}`);
    if (enr.target_users) facts.push(`👥 ${enr.target_users}`);
    if (enr.traction) facts.push(`📈 ${enr.traction}`);
  }

  return (
    <article
      className={`rounded-card border border-hair ${band.ring} border-l-2 bg-surface p-6`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${band.text}`}>
              <span className={`h-2 w-2 rounded-full ${band.dot}`} /> {band.label}
            </span>
            <span className="text-ink-muted">·</span>
            <span className="font-display text-ink">fit {comp.fit}</span>
            <span className="text-ink-muted">·</span>
            <span className="text-ink-secondary">güven: {comp.confidence}</span>
            {isBench(comp) && (
              <>
                <span className="text-ink-muted">·</span>
                <span className="text-ink" title="Bench çıtası: fit ≥ 80 · güven yüksek">
                  🏅 bench
                </span>
              </>
            )}
          </div>
          <a
            href={signal.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block truncate font-display text-lg font-semibold text-ink hover:text-brand"
          >
            {signal.title}
          </a>
          <div className="mt-1 text-xs text-ink-muted">
            {signal.source}
            {enr?.signal_kind && <> · {KIND_LABEL[enr.signal_kind]}</>}
            {signal.market && <> · {signal.market}</>}
            {signal.sector && <> · {signal.sector}</>}
            {enr && !enr.fetch_ok && (
              <span className="ml-2 opacity-70">· sayfa çekilemedi</span>
            )}
          </div>
          {facts.length > 0 && (
            <div className="mt-1.5 text-xs text-ink-secondary">{facts.join(" · ")}</div>
          )}
        </div>
        {pending && !notActionable && (
          <span className="chip shrink-0 border-strong text-brand">🔎 doğrulama bekliyor</span>
        )}
      </div>

      {(notActionable || noData) && (
        <div className="mt-4 rounded-btn border border-hair bg-elevated px-3 py-2 text-xs text-ink-secondary">
          {notActionable ? (
            <>
              <span className="text-ink">Karar verilecek teşebbüs yok</span> — bu bir{" "}
              {KIND_LABEL[enr!.signal_kind!]}. Arkasında şirket/ürün/yatırım turu olmadığı için
              kovalanamaz; fikir olarak değerliyse tez notlarına geçir.
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

      {enr && (
        <p className="mt-4 text-sm leading-relaxed text-ink">
          {enr.project_summary}
        </p>
      )}

      {activeLenses.map((lens, i) => {
        const a = analyses[lens.id]!;
        const note = lens.extraNote(a);
        return (
          <div key={lens.id} className={i > 0 ? "mt-4 border-t border-hair pt-4" : "mt-4"}>
            {activeLenses.length > 1 && (
              <div className="text-xs font-medium text-ink-muted">
                {lens.name} · fit {a.fit} · güven: {a.confidence}
              </div>
            )}
            <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{a.rationale}</p>

            {note && (
              <p className="mt-2 text-sm text-ink-secondary">
                <span className="text-ink-muted">{lens.extraNoteLabel}: </span>
                {note}
              </p>
            )}

            {a.risks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {a.risks.map((r, ri) => (
                  <span key={ri} className="chip">
                    ⚠ {r}
                  </span>
                ))}
              </div>
            )}

            {a.validation_needed.length > 0 && (
              <div className="mt-3 rounded-btn border border-hair bg-elevated p-3">
                <div className="text-xs font-medium text-brand">Doğrulama görevleri</div>
                <ul className="mt-2 space-y-1.5">
                  {a.validation_needed.map((v, vi) => (
                    <li key={vi} className="text-xs text-ink-secondary">
                      <span className="text-ink">{v.data}</span> — {v.why}{" "}
                      <span className="text-ink-muted">(nasıl: {v.how_to_verify})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-5">
        <DecisionButtons signalId={signal.id} mine={mine} others={others} />
      </div>

      <Comments signalId={signal.id} initial={comments} />
    </article>
  );
}
