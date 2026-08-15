import {
  composite,
  isActionableKind,
  isBench,
  StoredEnrichmentSchema,
  type Lens,
  type RankedItem,
} from "@idea-factory/core";
import type { Decision, UserDecision } from "../components/DecisionButtons";
import type { Comment } from "../components/Comments";
import type { TaskItem } from "../components/TaskList";
import type { FinalDecision } from "./load-final-decisions";
import type { CardView, DebateView, Fact } from "./card-view";

const KIND_LABEL: Record<string, string> = {
  venture: "girişim",
  product: "ürün",
  funding: "yatırım turu",
  essay: "görüş yazısı",
  research: "araştırma",
  other: "sınıflanmadı",
};

/** Server-only: `RankedItem` + karar/yorum verisini tek, serileştirilebilir `CardView`'a düzleştirir.
 *  `lensRegistry`: builtin + aktif admin-mercekleri (bkz. `/admin/mercekler`) birleşik dizi.
 *  `debates`/`isAdmin`: AI Yorumcusu (Faz 3-E) admin-only — admin değilse boş dizi geçilir. */
export function buildCardView(
  item: RankedItem,
  mine: Decision | null,
  others: UserDecision[],
  comments: Comment[],
  tasks: TaskItem[],
  lensRegistry: Lens[],
  isAdmin: boolean,
  debates: DebateView[],
  final: FinalDecision | null = null,
): CardView {
  const { signal, analyses } = item;
  const comp = composite(analyses, lensRegistry);
  const enrParsed = StoredEnrichmentSchema.safeParse(
    (signal as { enrichment?: unknown }).enrichment,
  );
  const enr = enrParsed.success ? enrParsed.data : null;
  const notActionable = enr?.signal_kind ? !isActionableKind(enr.signal_kind) : false;
  const noData = !enr;

  const facts: Fact[] = [];
  if (enr) {
    if (enr.hq_country) facts.push({ kind: "geo", text: enr.hq_country });
    if (enr.markets.length) facts.push({ kind: "markets", text: enr.markets.join(", ") });
    if (enr.funding.stage || enr.funding.amount)
      facts.push({ kind: "funding", text: [enr.funding.stage, enr.funding.amount].filter(Boolean).join(" ") });
    if (enr.target_users) facts.push({ kind: "users", text: enr.target_users });
    if (enr.traction) facts.push({ kind: "traction", text: enr.traction });
  }

  const lensViews = lensRegistry
    .filter((l) => analyses[l.id])
    .map((l) => {
      const a = analyses[l.id]!;
      return {
        id: l.id,
        name: l.name,
        fit: a.fit,
        confidence: a.confidence,
        rationale: a.rationale,
        extraNoteLabel: l.extraNoteLabel,
        note: l.extraNote(a),
        risks: a.risks,
        validation_needed: a.validation_needed,
      };
    });

  return {
    id: signal.id,
    title: signal.title,
    url: signal.url,
    source: signal.source,
    market: signal.market,
    sector: signal.sector,
    postedAt: signal.posted_at,
    fetchedAt: signal.fetched_at,
    kindLabel: enr?.signal_kind ? (KIND_LABEL[enr.signal_kind] ?? null) : null,
    fit: comp.fit,
    confidence: comp.confidence,
    band: comp.band,
    bench: isBench(comp),
    notActionable,
    noData,
    fetchOk: enr?.fetch_ok ?? true,
    summary: enr?.project_summary ?? null,
    facts,
    pending: lensViews.some((l) => l.validation_needed.length > 0),
    lensViews,
    mine,
    others,
    comments,
    tasks,
    isAdmin,
    debates,
    finalDecision: final?.decision ?? null,
    finalDecidedBy: final?.decidedBy ?? null,
    finalReason: final?.reason ?? null,
    watchReviewAt: (signal as { watch_review_at?: string | null }).watch_review_at ?? null,
  };
}
