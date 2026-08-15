import { db } from "../db.js";

// web/lib/source-health.ts'teki KNOWN_SOURCES ile senkron tutulmalı.
const KNOWN_SOURCES = ["producthunt", "tldr", "webrazzi", "techcrunch", "ycombinator"];

export interface IngestionSettings {
  per_source_limit: number;
  concurrency: number;
  enabled_sources: string[];
  min_interval_hours: number;
}

/** Hiç ayar kaydedilmemişse `ingest.ts`'in bugüne kadarki gerçek davranışı: sınırsız + sıralı + hepsi açık. */
export const DEFAULT_INGESTION_SETTINGS: IngestionSettings = {
  per_source_limit: 0,
  concurrency: 1,
  enabled_sources: [...KNOWN_SOURCES],
  min_interval_hours: 0,
};

/** Admin panelinde (`/admin` → Toplama) kaydedilmiş aktif toplama ayarı, yoksa değişmeyen varsayılan. */
export async function loadActiveIngestionSettings(): Promise<IngestionSettings> {
  const { data, error } = await db
    .from("ingestion_settings")
    .select("config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return DEFAULT_INGESTION_SETTINGS;
  const config = data.config as Partial<IngestionSettings>;
  return {
    per_source_limit: config.per_source_limit ?? 0,
    concurrency: config.concurrency ?? 1,
    enabled_sources: config.enabled_sources?.length ? config.enabled_sources : [...KNOWN_SOURCES],
    min_interval_hours: config.min_interval_hours ?? 0,
  };
}

/** İki çekim arası asgari saat ayarını uygular — son sinyalin `fetched_at`'i yeterince
 *  eski değilse bu tick'i atlamak için true döner. */
export async function shouldSkipForInterval(minIntervalHours: number): Promise<boolean> {
  if (minIntervalHours <= 0) return false;
  const { data, error } = await db
    .from("signals")
    .select("fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.fetched_at) return false;
  const lastFetch = Date.parse(data.fetched_at);
  if (Number.isNaN(lastFetch)) return false;
  const elapsedHours = (Date.now() - lastFetch) / 3_600_000;
  return elapsedHours < minIntervalHours;
}
