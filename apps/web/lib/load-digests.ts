import { buildDigest, benchItems } from "@idea-factory/core";
import { serverDb } from "./supabase";
import { DEMO_ITEMS } from "./demo";

export interface DigestRow {
  id: string;
  markdown: string;
  item_count: number;
  bench_count: number;
  created_at: string;
}

/** Son `limit` digest çalıştırması (en yeni önce). db yoksa (demo/lokal) `/queue` ile aynı
 *  `DEMO_ITEMS`'tan tek örnek digest üretir — sayfa her ortamda dolu görünür. */
export async function loadDigests(limit = 14): Promise<DigestRow[]> {
  const db = serverDb();
  if (!db) {
    return [
      {
        id: "demo",
        markdown: buildDigest(DEMO_ITEMS),
        item_count: DEMO_ITEMS.length,
        bench_count: benchItems(DEMO_ITEMS).length,
        created_at: new Date().toISOString(),
      },
    ];
  }
  const { data, error } = await db
    .from("digests")
    .select("id, markdown, item_count, bench_count, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as DigestRow[];
}
