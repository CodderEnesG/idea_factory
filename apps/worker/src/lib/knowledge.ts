import type { Signal } from "@idea-factory/core";

const MAX_NOTES = 8;

export interface RelatedSignal {
  id: string;
  title: string;
  sector: string | null;
  market: string | null;
  summary_raw?: string;
}

export interface DecisionRow {
  decision: string;
  note: string | null;
  decided_by: string | null;
  created_at: string;
  signal: RelatedSignal | null;
}

export interface CommentRow {
  body: string;
  author: string;
  created_at: string;
  signal: RelatedSignal | null;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function tokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(/[^a-z0-9ğüşıöç]+/)
      .filter(Boolean),
  );
}

/**
 * Bir alan çiftinin (sector veya market) örtüşme puanı: tam eşleşme (boşluk/büyük-küçük
 * harf bağımsız) = 3, paylaşılan kelime başına 1 puan, örtüşme yoksa 0. Embedding değil —
 * "SaaS" ↔ "B2B SaaS" gibi alt-küme örtüşmelerini ucuza yakalayan sözcüksel bir yaklaşım.
 */
function fieldScore(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  if (normalize(a) === normalize(b)) return 3;
  let shared = 0;
  const tb = tokens(b);
  for (const t of tokens(a)) if (tb.has(t)) shared++;
  return shared;
}

// Bu alanda neredeyse her başlıkta geçen jenerik kelimeler — filtrelenmezse "aynı sektördeki
// her şey birbiriyle biraz alakalı" gibi görünüp asıl ayırt ediciliği boğar.
const STOPWORDS = new Set([
  "ve", "bir", "bu", "için", "ile", "de", "da", "ki", "mi", "yeni", "ürün", "şirket",
  "the", "a", "an", "and", "or", "for", "with", "of", "to", "in", "on", "is", "are",
  "new", "product", "startup", "company", "platform", "app", "launch", "launches",
  "raises", "funding", "million", "billion",
]);

/** İçerik (başlık+özet) token'ları — jenerik kelimeler ve tek/iki harfli gürültü elenir. */
function contentTokens(...parts: (string | null | undefined)[]): Set<string> {
  const t = tokens(parts.filter(Boolean).join(" "));
  for (const w of t) {
    if (STOPWORDS.has(w) || w.length <= 2) t.delete(w);
  }
  return t;
}

/**
 * Başlık/özet kelime örtüşmesi — yalnız zaten kategorik olarak alakalı (aynı sektör/pazar
 * kovası) çiftler arasında AYIRT EDİCİLİK için (bkz. `relevance`). Tavanlı: uzun bir özet
 * tek başına skoru domine etmesin.
 */
function contentOverlapScore(signal: Signal, related: RelatedSignal): number {
  const a = contentTokens(signal.title, signal.summary_raw);
  const b = contentTokens(related.title, related.summary_raw);
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return Math.min(shared, 5);
}

/**
 * Sinyal ↔ ilgili-sinyal alaka puanı: önce sector+market (kategorik, kapı görevi görür —
 * ikisi de örtüşmezse 0 ve içerik metnine HİÇ bakılmaz, gürültüden kaçınmak için). Kategorik
 * örtüşme varsa başlık/özet kelime örtüşmesi eklenir — aynı geniş kovadaki (ör. "B2B SaaS")
 * kayıtları birbirinden ayırt etmek için (tezin dar sektör listesi yüzünden kova zaten kalabalık).
 */
function relevance(signal: Signal, related: RelatedSignal | null): number {
  if (!related) return 0;
  const categorical = fieldScore(signal.sector, related.sector) + fieldScore(signal.market, related.market);
  if (categorical === 0) return 0;
  return categorical + contentOverlapScore(signal, related);
}

function byRelevanceThenRecency<T extends { created_at: string }>(
  scored: Array<{ row: T; score: number }>,
): T[] {
  return [...scored]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Date.parse(b.row.created_at) - Date.parse(a.row.created_at);
    })
    .map((s) => s.row);
}

/**
 * Geçmiş ekip kararları + yorumlarından, bu sinyalle alakalı notları derler. Sıralama önce
 * alaka puanı (fieldScore), sonra tazelik tiebreak — ranker.ts'teki bant+tazelik deseniyle
 * aynı felsefe (skor birinci, tazelik yalnız eşitlerde belirleyici). decisions append-only →
 * (ilgili-sinyal, kullanıcı) başına yalnız en-yeni karar sayılır.
 */
export function buildNotes(
  signal: Signal,
  decisionRows: DecisionRow[],
  commentRows: CommentRow[],
): string[] {
  const latestByUser = new Map<string, DecisionRow>();
  for (const row of decisionRows) {
    if (relevance(signal, row.signal) === 0) continue;
    const key = `${row.signal!.id}:${row.decided_by ?? "?"}`;
    const prev = latestByUser.get(key);
    if (!prev || Date.parse(row.created_at) > Date.parse(prev.created_at)) {
      latestByUser.set(key, row);
    }
  }
  const rankedDecisions = byRelevanceThenRecency(
    [...latestByUser.values()].map((row) => ({ row, score: relevance(signal, row.signal) })),
  ).slice(0, MAX_NOTES);
  const decisionNotes = rankedDecisions.map((row) => {
    const who = row.decided_by ?? "ekip";
    const note = row.note ? ` — "${row.note}"` : "";
    return `${who}: "${row.signal!.title}" için ${row.decision}${note}`;
  });

  const rankedComments = byRelevanceThenRecency(
    commentRows
      .filter((row) => relevance(signal, row.signal) > 0)
      .map((row) => ({ row, score: relevance(signal, row.signal) })),
  ).slice(0, MAX_NOTES);
  const commentNotes = rankedComments.map(
    (row) => `${row.author} ("${row.signal!.title}" yorumu): ${row.body}`,
  );

  return [...decisionNotes, ...commentNotes];
}
