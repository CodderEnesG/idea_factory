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
  transcript: DebateTurnView[];
  final_verdict: Band;
  final_commentary: string;
  created_by: string;
  created_at: string;
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
