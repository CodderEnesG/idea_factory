import { canonicalSourceName } from "./source-health";

/**
 * Kanıtlı gelir listesi (2026-09-27) — gelir/sıralama kanıtı taşıyan kaynaklar Gelen kutusuna
 * karışmaz, kendi sekmelerinde metriğe göre sıralanır. Metrik `signals.source_meta`'da
 * (0016); worker tarafı: apps/worker/src/lib/revenue-signal.ts.
 */
export const REVENUE_SOURCES = ["manual_revenue", "appstore_grossing"] as const;

export function isRevenueSource(source: string): boolean {
  return (REVENUE_SOURCES as readonly string[]).includes(canonicalSourceName(source));
}

/** İki kaynağın ortak okunan alanları; hepsi opsiyonel — eski/eksik satır liste dışı kalmasın. */
export interface RevenueMeta {
  kind?: string;
  rank?: number | null;
  us_rank?: number | null;
  /** App Store: sıranın geldiği liste — "overall" ya da kategori adı ("Health & Fitness"). */
  chart?: string | null;
  revenue_30d_usd?: number | null;
  mrr_usd?: number | null;
  growth_30d_pct?: number | null;
}

const compactUsd = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` : `$${Math.round(n)}`;

/** Satırda görünen tek kısa metrik: "30g $85.9K ↑12%" · "MRR $4.2K" · "ABD hasılat #37" · "gelir #4". */
export function revenueMetricLine(meta: RevenueMeta | undefined): string | null {
  if (!meta) return null;
  if (meta.us_rank != null)
    return meta.chart && meta.chart !== "overall" ? `ABD ${meta.chart} #${meta.us_rank}` : `ABD hasılat #${meta.us_rank}`;
  const parts: string[] = [];
  if (meta.revenue_30d_usd != null) parts.push(`30g ${compactUsd(meta.revenue_30d_usd)}`);
  else if (meta.mrr_usd != null) parts.push(`MRR ${compactUsd(meta.mrr_usd)}`);
  else if (meta.rank != null) parts.push(`gelir #${meta.rank}`);
  if (meta.growth_30d_pct != null && parts.length) {
    const g = meta.growth_30d_pct;
    parts.push(g > 0 ? `↑${g}%` : g < 0 ? `↓${-g}%` : "0%");
  }
  return parts.length ? parts.join(" ") : null;
}

/** Sıralama anahtarı: kaynaktaki sıra (gelir sıralaması / App Store sırası) önce, yoksa gelir. */
function rankOf(meta: RevenueMeta | undefined): number {
  return meta?.rank ?? meta?.us_rank ?? Number.POSITIVE_INFINITY;
}
function revenueOf(meta: RevenueMeta | undefined): number {
  return meta?.revenue_30d_usd ?? meta?.mrr_usd ?? -1;
}

/** Kaynak sırasına göre (küçük önce), eşitlikte gelire göre (büyük önce); metasız satırlar sonda. */
export function sortByRevenue<T extends { id: string }>(rows: T[], metaById: Map<string, RevenueMeta>): T[] {
  return [...rows].sort((a, b) => {
    const ma = metaById.get(a.id);
    const mb = metaById.get(b.id);
    const byRank = rankOf(ma) - rankOf(mb);
    if (byRank !== 0 && Number.isFinite(byRank)) return byRank;
    if (rankOf(ma) !== rankOf(mb)) return Number.isFinite(rankOf(ma)) ? -1 : 1;
    return revenueOf(mb) - revenueOf(ma);
  });
}
