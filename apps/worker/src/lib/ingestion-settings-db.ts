import { db } from "../db.js";

export interface IngestionSettings {
  per_source_limit: number;
  concurrency: number;
}

/** Hiç ayar kaydedilmemişse `ingest.ts`'in bugüne kadarki gerçek davranışı: sınırsız + sıralı. */
export const DEFAULT_INGESTION_SETTINGS: IngestionSettings = {
  per_source_limit: 0,
  concurrency: 1,
};

/** Admin panelinde (`/admin/toplama`) kaydedilmiş aktif toplama ayarı, yoksa değişmeyen varsayılan. */
export async function loadActiveIngestionSettings(): Promise<IngestionSettings> {
  const { data, error } = await db
    .from("ingestion_settings")
    .select("config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return DEFAULT_INGESTION_SETTINGS;
  return data.config as IngestionSettings;
}
