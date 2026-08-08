import { thesis as defaultThesis, type ThesisConfig } from "@idea-factory/core";
import { serverDb } from "./supabase";

/** `/admin/tez`de kaydedilmiş aktif tez versiyonu, yoksa `thesis.config.ts` fallback'i. */
export async function loadActiveThesis(): Promise<ThesisConfig> {
  const db = serverDb();
  if (!db) return defaultThesis;
  const { data } = await db
    .from("thesis_versions")
    .select("config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? (data.config as ThesisConfig) : defaultThesis;
}
