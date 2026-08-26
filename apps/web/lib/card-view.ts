import type { Decision, UserDecision } from "../components/DecisionButtons";
import type { Comment } from "../components/Comments";
import type { TaskItem } from "../components/TaskList";

/**
 * Kuyruk kartının UI'a hazır, tamamen serileştirilebilir görünümü. `@idea-factory/core`
 * (enrichment.ts üzerinden @google/genai + @anthropic-ai/sdk'yi zincirler) yalnız
 * `build-card-view.ts`'te (server-only) içe aktarılır — bu şekil, istemci bileşenlerinin
 * (QueueBoard/DetailPanel/PanomCard) core paketine hiç dokunmadan çalışmasını sağlar, aksi halde
 * webpack client bundle'ında `node:crypto` (hash.ts) hatası verir.
 */
export type Band = "pursue" | "watch" | "kill";
export type Confidence = "low" | "med" | "high";

export interface ValidationTask {
  data: string;
  why: string;
  how_to_verify: string;
}

export interface LensView {
  id: string;
  name: string;
  fit: number;
  confidence: Confidence;
  rationale: string;
  extraNoteLabel: string;
  note: string;
  risks: string[];
  validation_needed: ValidationTask[];
}

export interface DebateTurnView {
  speaker: string;
  message: string;
  evidence: { fact: string; source: string }[];
  rebuts: string[];
  position?: Band;
}

export type FactKind = "geo" | "markets" | "funding" | "users" | "traction";

export interface Fact {
  kind: FactKind;
  text: string;
}

export interface DebateView {
  id: string;
  /** Liste sorgusunda YOK (null) — kart açılınca `/api/debates/[signalId]` ile lazy yüklenir.
   *  260 × 7-tur transkript her `/queue` render'ında uygulamanın en büyük JSONB yüküydü. */
  transcript: DebateTurnView[] | null;
  final_verdict: Band;
  final_commentary: string;
  created_by: string;
  created_at: string;
  /** 0014: 'auto' = kapı turu, 'manual' = admin elle tetikledi. */
  kind: string;
  /** 0014: auto turun sırası (1 veya 2). */
  run_no: number | null;
  /** 0014 generated column — transkript lazy olduğu için "N tur" etiketi bundan gelir. */
  turn_count: number | null;
}

/** Beyaz-alan merceğinin karta yansıyan hâli (ağırlık 0 — skora girmez, görünür sinyaldir). */
export type CompetitionLabel = "boş" | "kalabalık" | "karışık" | "belirsiz";

export interface CompetitionView {
  fit: number;
  confidence: Confidence;
  label: CompetitionLabel;
  note: string;
}

export interface CardView {
  id: string;
  title: string;
  url: string;
  source: string;
  market: string | null;
  sector: string | null;
  postedAt: string | null;
  fetchedAt: string;
  kindLabel: string | null;
  fit: number;
  confidence: Confidence;
  band: Band;
  /** AI kompozit bandının Yorumcu kapısından geçmiş hâli — bkz. `resolveGatedBand`.
   *  Kapı yalnız DÜŞÜREBİLİR; `band` (ham AI) dökümde ayrı bilgi olarak kalır. */
  gatedBand: Band;
  /** Kapının durumu: pending (2 tartışma tamamlanmadı) · confirmed · caveat · vetoed · n/a. */
  gate: GateState;
  /** Kesinleşmiş > kişisel > kapılı AI bandı — bkz. `resolveEffectiveBand`.
   *  Görsel bant/rozet/sıralama artık HEP bunu kullanır. */
  effectiveBand: Band;
  /** Rekabet ortamı (beyaz-alan merceği) — yoksa null. */
  competition: CompetitionView | null;
  bench: boolean;
  notActionable: boolean;
  noData: boolean;
  fetchOk: boolean;
  summary: string | null;
  facts: Fact[];
  pending: boolean;
  lensViews: LensView[];
  mine: Decision | null;
  others: UserDecision[];
  comments: Comment[];
  tasks: TaskItem[];
  isAdmin: boolean;
  debates: DebateView[];
  /** 0013 — kişisel kararlardan ayrı, sinyal başına TEK "resmi" karar (problem 1). */
  finalDecision: Decision | null;
  finalDecidedBy: string | null;
  finalReason: string | null;
  /** final karar "watch" iken set edilir (+30g); geçmişse Panom "Bugün gözden geçir"e girer. */
  watchReviewAt: string | null;
}

/* ── Yorumcu kapısı (FAZ6_PLAN.md §Faz 2.1) ───────────────────────────────
 *
 * Ölçüm (2026-08-25, 79 AI-kovala sinyal + 155 insan kararı):
 *   ham AI "kovala"  -> insan-kovala kesinliği %22 (36'sı, yani %46'sı ELE edildi)
 *   + yorumcu ele demedi -> %53
 * Yorumcunun insanla uyumu %60, ham AI'ın %25. Bu yüzden tartışma artık kararın ARKASINDA
 * değil ÖNÜNDE: her AI-kovala adayı, insan görmeden İKİ bağımsız tartışmadan geçer.
 *
 * İki tasarım kararı, ikisi de ölçüme dayalı:
 *  1. VETO modeli, "ikisi de onaylasın" değil. Tartışma verdict dağılımı 195 ele / 62 izle /
 *     3 kovala — `verdict === "pursue"` şartı kovala sütununu boşaltırdı. Ölçülen kural zaten
 *     veto formu ("ele DEMEDİ"). `watch` bandı düşürmez, görünür bir çekince koyar.
 *  2. Tartışma bandı ASLA YÜKSELTMEZ. Eski `debateVerdict ?? aiBand` izle bandındaki bir
 *     sinyali, admin'in elle tartıştırdığı `pursue` verdict'iyle tek başına Kovala yapıyordu —
 *     bu bir kapı değil. Artık temkinli olan kazanır.
 */

export type GateState = "n/a" | "pending" | "confirmed" | "caveat" | "vetoed";

/** Kapının kapanması için gereken bağımsız tartışma sayısı. Tartışmanın kendi test-retest
 *  tutarlılığı %67 (27 mükerrer tartışmanın 9'u farklı sonuç verdi) — tek koşu şansa açık. */
export const GATE_REQUIRED_DEBATES = 2;

/** `true` yapılırsa "ikisi de izle" de kovaladan düşürür (sıkı okuma). Verdict karışımı
 *  değişirse tek satırla geçilebilsin diye sabit — bugün ölçüm veto formunu destekliyor. */
export const DEBATE_WATCH_DEMOTES = false;

const BAND_RANK: Record<Band, number> = { pursue: 0, watch: 1, kill: 2 };

/** İkisinden daha temkinli olanı (kill > watch > pursue). */
function moreConservative(a: Band, b: Band): Band {
  return BAND_RANK[a] >= BAND_RANK[b] ? a : b;
}

export interface GateResult {
  band: Band;
  gate: GateState;
}

/**
 * AI kompozit bandını tartışma sonuçlarıyla süzer.
 *
 * | aiBand   | tartışma            | -> bant   | gate      |
 * |----------|---------------------|-----------|-----------|
 * | ≠ pursue | yok                 | aiBand    | n/a       |
 * | ≠ pursue | var                 | temkinli  | n/a       |
 * | pursue   | < 2 tur             | **watch** | pending   |
 * | pursue   | biri "ele"          | kill      | vetoed    |
 * | pursue   | ≥1 "kovala", ele yok| pursue    | confirmed |
 * | pursue   | ikisi de "izle"     | pursue    | caveat    |
 *
 * `pending -> watch` satırı flicker sorununun tam cevabı: fit≥80 bir sinyal, iki tartışma
 * yazılana kadar HİÇBİR tick'te kovala bandında olmaz. Tartışma bütçesi aşılırsa fazlası
 * pending kalır — hata modu temkinli tarafa bozulur, asla sahte Kovala'ya değil.
 */
export function resolveGatedBand(
  aiBand: Band,
  debateVerdicts: Band[],
  gateEnabled = true,
): GateResult {
  if (!gateEnabled) return { band: aiBand, gate: "n/a" };

  if (aiBand !== "pursue") {
    // Kapı yalnız kovalayı süzer, ama tartışma yine de yükseltemez: izle bandındaki bir
    // sinyal "ele" verdict'i aldıysa ele olur.
    const worst = debateVerdicts.reduce<Band>((acc, v) => moreConservative(acc, v), aiBand);
    return { band: worst, gate: "n/a" };
  }

  if (debateVerdicts.length < GATE_REQUIRED_DEBATES) return { band: "watch", gate: "pending" };
  if (debateVerdicts.includes("kill")) return { band: "kill", gate: "vetoed" };
  if (debateVerdicts.includes("pursue")) return { band: "pursue", gate: "confirmed" };
  return DEBATE_WATCH_DEMOTES
    ? { band: "watch", gate: "pending" }
    : { band: "pursue", gate: "caveat" };
}

/**
 * Tek hiyerarşi (2026-08-19 kullanıcı kararı, 2026-08-26'da kapıyla güncellendi) —
 * Kuyruk/Panom'da üç ayrı, birbirinden habersiz "kim kazanır" mantığı vardı. Artık TEK yer.
 *
 * Sıra: **Kesinleşmiş (kilitli ekip kararı) > Kişisel karar > kapılı AI bandı.**
 * Yorumcu katmanı artık ayrı bir tier değil — `resolveGatedBand` içinde AI bandına gömülü
 * (ve yalnız düşürebiliyor). İnsan kararı her zaman ikisinin de üstünde.
 */
export function resolveEffectiveBand(
  gatedBand: Band,
  mine: Decision | null,
  finalDecision: Decision | null,
): Band {
  return finalDecision ?? mine ?? gatedBand;
}

/**
 * Panom'un KASITLI olarak farklı hiyerarşisi (PLAN.md §19 kararı korunuyor).
 * Panom = "ne karar verdik", Kuyruk = "sistem şu an ne düşünüyor" — iki ayrı soru:
 *  - Panom'un üyelik filtresi zaten en az bir insan kararı garanti eder, o yüzden AI/kapı
 *    katmanına HİÇ düşülmez.
 *  - 4. katman (başkasının en son kararı) Kuyruk'ta OLMAMALI: takım arkadaşının görüşünü
 *    senin bandın gibi göstermek yanlış olur.
 * İsimsiz bir kopya olarak PanomBoard içinde yaşıyordu; buraya taşındı ki ayrım kodda
 * belgeli olsun ve biri değişince diğeri sessizce kaymasın.
 */
export function resolvePanomBand(
  mine: Decision | null,
  finalDecision: Decision | null,
  latestOther: Decision | null,
): Band | null {
  return finalDecision ?? mine ?? latestOther;
}
