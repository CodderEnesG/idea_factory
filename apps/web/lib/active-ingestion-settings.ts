import { serverDb } from "./supabase";
import { KNOWN_SOURCES } from "./source-health";

export interface IngestionSettings {
  version: string;
  /** Kaynak başına bu koşuda tutulacak azami sinyal — 0 = sınırsız (bugünkü davranış). */
  per_source_limit: number;
  /** Kaç kaynağın aynı anda çekileceği — 1 = sıralı (bugünkü davranış). */
  concurrency: number;
  /** Aktif kaynaklar (kanonik ad) — bir kaynağı geçici kapatmak için. Boş/eksikse: hepsi açık. */
  enabled_sources: string[];
  /** İki çekim arası asgari saat — 0 = kapalı, her tetiklemede çeker (bugünkü davranış).
   *  Not: gerçek sıklık bu değer ile GitHub Actions'ın kendi zamanlamasının (şu an 12 saatte
   *  bir) küçük olanı kadar sık olabilir — workflow dosyası ayrıca değişmeden bu ayar tek
   *  başına sıklığı ARTIRAMAZ, yalnız var olan tetiklemeleri seyreltebilir. */
  min_interval_hours: number;
}

/** Hiç ayar kaydedilmemişse `ingest.ts`'in bugünkü gerçek davranışı: sınırsız + sıralı + hepsi açık. */
export const DEFAULT_INGESTION_SETTINGS: IngestionSettings = {
  version: "varsayılan",
  per_source_limit: 0,
  concurrency: 1,
  enabled_sources: [...KNOWN_SOURCES],
  min_interval_hours: 0,
};

/** `/admin`(Toplama)'da kaydedilmiş aktif toplama ayarı, yoksa değişmeyen varsayılan. */
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
  const config = data.config as Partial<IngestionSettings>;
  return {
    version: data.version,
    per_source_limit: config.per_source_limit ?? 0,
    concurrency: config.concurrency ?? 1,
    enabled_sources: config.enabled_sources?.length ? config.enabled_sources : [...KNOWN_SOURCES],
    min_interval_hours: config.min_interval_hours ?? 0,
  };
}
