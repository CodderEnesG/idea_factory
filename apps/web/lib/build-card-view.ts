import {
  composite,
  isActionableKind,
  isBench,
  StoredEnrichmentSchema,
  WHITE_SPACE_GAP_MIN,
  type BaseAnalysis,
  type Composite,
  type Lens,
  type RankedItem,
} from "@idea-factory/core";
import type { Decision, UserDecision } from "../components/DecisionButtons";
import type { Comment } from "../components/Comments";
import type { TaskItem } from "../components/TaskList";
import type { FinalDecision } from "./load-final-decisions";
import {
  resolveEffectiveBand,
  resolveGatedBand,
  type Band,
  type CardView,
  type CompetitionLabel,
  type CompetitionView,
  type DebateView,
  type Fact,
  type GateState,
} from "./card-view";

const KIND_LABEL: Record<string, string> = {
  venture: "girişim",
  product: "ürün",
  funding: "yatırım turu",
  essay: "görüş yazısı",
  research: "araştırma",
  other: "sınıflanmadı",
};

const BAND_ORDER: Record<Band, number> = { pursue: 0, watch: 1, kill: 2 };

/**
 * Bir kartın TÜM bant katmanlarını tek yerde çözer (FAZ6_PLAN.md §Faz 2.2). Eskiden bu
 * hiyerarşi üç ayrı yerde elle yazılıydı — `queue/page.tsx` sunucu sıralamasını kendi
 * kopyasıyla hesaplıyordu ve kapıyı öğrenmezse bekleyen/veto edilmiş sinyaller pursue
 * bandında sıralanıp İzle/Ele olarak render edilirdi.
 *
 * `debates` created_at DESC sıralı gelir (load-debates.ts). Kapı yalnız OTOMATİK turları
 * sayar: admin'in elle tetiklediği tartışma bir kapı turu değildir (aksi halde tek bir manuel
 * tetikleme kapıyı erken kapatırdı) — ama verdict'i yine de temkinli-kazanır kuralına girer.
 */
export function resolveCardBands(args: {
  comp: Composite;
  mine: Decision | null;
  final: Decision | null;
  debates: DebateView[];
  gateEnabled?: boolean;
}): { aiBand: Band; gatedBand: Band; gate: GateState; effectiveBand: Band } {
  const { comp, mine, final, debates, gateEnabled = true } = args;
  const autoVerdicts = debates.filter((d) => d.kind === "auto").map((d) => d.final_verdict);
  const manualVerdicts = debates.filter((d) => d.kind !== "auto").map((d) => d.final_verdict);
  const gated = resolveGatedBand(comp.band, autoVerdicts, gateEnabled);
  // Elle tetiklenmiş tartışma kapıyı kapatmaz ama yükseltemez de — temkinli olan kazanır.
  const withManual = gateEnabled
    ? manualVerdicts.reduce<Band>(
        (acc, v) => (BAND_ORDER[v] >= BAND_ORDER[acc] ? v : acc),
        gated.band,
      )
    : gated.band;
  return {
    aiBand: comp.band,
    gatedBand: withManual,
    gate: gated.gate,
    effectiveBand: resolveEffectiveBand(withManual, mine, final),
  };
}


/**
 * Beyaz-alan merceğini karta yansıt. Ağırlığı 0 — skora GİRMEZ, görünür ikinci görüştür.
 * `confidence === "low"` her fit testinden ÖNCE "belirsiz"e düşer: satırların %66'sı burada
 * ve düşük güvenli bir okumayı bulguymuş gibi göstermek, %22 kesinliği üreten hatanın kendisi.
 */
export function buildCompetitionView(
  analyses: Record<string, BaseAnalysis>,
  lensRegistry: Lens[],
): CompetitionView | null {
  const ws = analyses["white_space"];
  if (!ws) return null;
  const lens = lensRegistry.find((l) => l.id === "white_space");
  const label: CompetitionLabel =
    ws.confidence === "low"
      ? "belirsiz"
      : ws.fit >= WHITE_SPACE_GAP_MIN
        ? "boş"
        : ws.fit < 40
          ? "kalabalık"
          : "karışık";
  return {
    fit: ws.fit,
    confidence: ws.confidence,
    label,
    note: lens ? lens.extraNote(ws as never) : "",
  };
}

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
  gateEnabled = true,
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

  const bands = resolveCardBands({
    comp,
    mine,
    final: final?.decision ?? null,
    debates,
    gateEnabled,
  });

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
    gatedBand: bands.gatedBand,
    gate: bands.gate,
    effectiveBand: bands.effectiveBand,
    competition: buildCompetitionView(analyses, lensRegistry),
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
