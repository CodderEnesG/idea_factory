import { serverDb } from "./supabase";
import { ttlCache } from "./ttl-cache";
import { REVENUE_SOURCES, type RevenueMeta } from "./revenue-view";

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const revenueCache = ttlCache("revenue-meta", 45_000);

export interface RevenueMetaResult {
  /** Gelir kaynaklı TÜM sinyaller (analiz edilmemişler dahil) — sayaç için. */
  metaById: Map<string, RevenueMeta>;
  error: string | null;
}

async function build(): Promise<RevenueMetaResult> {
  const db = serverDb();
  if (!db) return { metaById: new Map(), error: null };
  const metaById = new Map<string, RevenueMeta>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db
      .from("signals")
      .select("id, source_meta")
      .in("source", [...REVENUE_SOURCES])
      .order("id")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) {
      console.error("[load-revenue-meta] hata:", error.message);
      return { metaById: new Map(), error: error.message };
    }
    for (const r of data ?? []) metaById.set(r.id as string, (r.source_meta ?? {}) as RevenueMeta);
    if ((data ?? []).length < PAGE_SIZE) break;
  }
  return { metaById, error: null };
}

/** Kanıtlı gelir sekmesinin metrikleri (`signals.source_meta`, 0016). 45 sn önbellekli; hata önbelleğe alınmaz. */
export async function loadRevenueMeta(): Promise<RevenueMetaResult> {
  const r = await revenueCache.get(build);
  if (r.error) revenueCache.bust();
  return r;
}
