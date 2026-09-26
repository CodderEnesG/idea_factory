import { z } from "zod";
import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";

/**
 * Elle girilen gelir kanıtlı sinyaller (Kanıtlı gelir listesi, 2026-09-27).
 *
 * Mobil/consumer fikirlerde "orada çalışıyor" kanıtı fon haberi değil gelir; toplama kaynaklarımız
 * bunu görmüyor. Kullanıcı gelir sıralaması ekran görüntüsü paylaşır, adı görünen şirketler web'de
 * araştırılır, bu kayıt formatına dökülür ve `scripts/add-revenue-signals.ts` ile eklenir.
 * Rakam iki yere yazılır: summary_raw (analist ve zenginleştirme okur, guard (g) traction ister)
 * ve source_meta (UI sıralar).
 */
export const MANUAL_REVENUE_SOURCE = "manual_revenue";

export const RevenueRecordSchema = z.object({
  name: z.string().min(1),
  website: z.string().url(),
  description: z.string().min(1),
  rank: z.number().int().positive().nullable().optional(),
  revenue_30d_usd: z.number().nonnegative().nullable().optional(),
  mrr_usd: z.number().nonnegative().nullable().optional(),
  growth_30d_pct: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  audience: z.enum(["b2b", "b2c", "both"]).nullable().optional(),
  mobile: z.boolean().nullable().optional(),
});
export type RevenueRecord = z.infer<typeof RevenueRecordSchema>;

const AUDIENCE_TR: Record<string, string> = { b2b: "işletmelere (B2B)", b2c: "tüketiciye (B2C)", both: "B2B + B2C" };

const usd = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

export function revenueSummary(r: RevenueRecord): string {
  const parts: string[] = [];
  const revenue: string[] = [];
  if (r.revenue_30d_usd != null) revenue.push(`son 30 gün ${usd(r.revenue_30d_usd)}`);
  if (r.mrr_usd != null) revenue.push(`MRR ${usd(r.mrr_usd)}`);
  if (r.rank != null) revenue.push(`gelir sıralaması #${r.rank}`);
  if (revenue.length) parts.push(`Ödeme sağlayıcısıyla doğrulanmış gelir: ${revenue.join(", ")}`);
  if (r.growth_30d_pct != null) parts.push(`30 günlük büyüme %${r.growth_30d_pct}`);
  if (r.audience) parts.push(AUDIENCE_TR[r.audience]!);
  if (r.mobile) parts.push("mobil uygulama");
  if (r.category) parts.push(r.category);
  parts.push(r.description.trim());
  return parts.join(" · ");
}

export function revenueRecordToSignal(r: RevenueRecord, capturedAt: string): Signal {
  const summary = revenueSummary(r);
  return SignalSchema.parse({
    id: shortHash(r.website),
    source: MANUAL_REVENUE_SOURCE,
    type: "company",
    title: r.name,
    url: r.website,
    summary_raw: summary,
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: capturedAt,
    content_hash: shortHash(`${r.name}\n${summary}`),
    source_meta: {
      kind: MANUAL_REVENUE_SOURCE,
      rank: r.rank ?? null,
      revenue_30d_usd: r.revenue_30d_usd ?? null,
      mrr_usd: r.mrr_usd ?? null,
      growth_30d_pct: r.growth_30d_pct ?? null,
      audience: r.audience ?? null,
      mobile: r.mobile ?? null,
      captured_at: capturedAt,
    },
  });
}
