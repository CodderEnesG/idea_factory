import { serverDb } from "./supabase";

export interface IngestionSettings {
  version: string;
  /** Kaynak başına bu koşuda tutulacak azami sinyal — 0 = sınırsız (bugünkü davranış). */
  per_source_limit: number;
  /** Kaç kaynağın aynı anda çekileceği — 1 = sıralı (bugünkü davranış). */
  concurrency: number;
}

/** Hiç ayar kaydedilmemişse `ingest.ts`'in bugünkü gerçek davranışı: sınırsız + sıralı. */
export const DEFAULT_INGESTION_SETTINGS: IngestionSettings = {
  version: "varsayılan",
  per_source_limit: 0,
  concurrency: 1,
};

/** `/admin/toplama`da kaydedilmiş aktif toplama ayarı, yoksa değişmeyen varsayılan. */
export async function loadActiveIngestionSettings(): Promise<IngestionSettings> {
  const db = serverDb();
  if (!db) return DEFAULT_INGESTION_SETTINGS;
  const { data } = await db
    .from("ingestion_settings")
    .select("version, config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return DEFAULT_INGESTION_SETTINGS;
  const config = data.config as { per_source_limit: number; concurrency: number };
  return { version: data.version, ...config };
}
