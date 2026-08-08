import { thesis as fallbackThesis, type ThesisConfig } from "@idea-factory/core";
import { db } from "../db.js";

/** Admin panelinde (`/admin/tez`) kaydedilmiş aktif tez versiyonu, yoksa `thesis.config.ts` fallback'i. */
export async function loadActiveThesis(): Promise<ThesisConfig> {
  const { data, error } = await db
    .from("thesis_versions")
    .select("config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return fallbackThesis;
  return data.config as ThesisConfig;
}
