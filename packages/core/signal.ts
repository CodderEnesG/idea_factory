import { z } from "zod";

/** Kaynaklar arası ortak sinyal şeması (PLAN.md §Signal şeması). */
export const SignalType = z.enum(["launch", "funding", "company"]);
export type SignalType = z.infer<typeof SignalType>;

export const SignalSchema = z.object({
  id: z.string(), // deterministik: hash(url)
  source: z.string(), // ör. "producthunt", "tldr:founders"
  type: SignalType,
  title: z.string().min(1),
  url: z.string().url(), // dedup anahtarı (unique)
  summary_raw: z.string().default(""),
  market: z.string().nullable().default(null),
  sector: z.string().nullable().default(null),
  posted_at: z.string().datetime({ offset: true }).nullable().default(null),
  fetched_at: z.string().datetime({ offset: true }),
  content_hash: z.string(), // naif dedup: hash(title+summary)
  // Zenginleştirme (0002) — default'suz optional: ingest insert'leri bu kolonları taşımaz.
  // Şekil StoredEnrichmentSchema (enrichment.ts); tüketici safeParse ile daraltır.
  enrichment: z.unknown().nullable().optional(),
  enriched_at: z.string().nullable().optional(),
  // 0013 — bkz. supabase/migrations/0013_final_decisions.sql. Yalnız `final_decisions`'ta
  // "watch" kesinleştiğinde set edilir; ingest/enrich bu kolonu hiç yazmaz.
  watch_review_at: z.string().nullable().optional(),
});
export type Signal = z.infer<typeof SignalSchema>;
