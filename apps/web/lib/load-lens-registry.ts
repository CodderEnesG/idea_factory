import { buildCustomLens, lenses, type CustomLensDef, type Lens } from "@idea-factory/core";
import { serverDb } from "./supabase";

/** Builtin mercekler + `/admin/mercekler`de eklenmiş aktif admin-mercekleri.
 *  `/queue`, `/harita`, `/trend` paylaşır — composite() ağırlığının custom mercekleri de
 *  doğru saymasını sağlamak için hepsi bu tam kayıt defterini kullanmalı (bkz. ranker.ts). */
export async function loadLensRegistry(): Promise<Lens[]> {
  const db = serverDb();
  if (!db) return lenses;
  const { data, error } = await db
    .from("lenses")
    .select("lens_id, name, weight, extra_note_label, questions")
    .eq("active", true);
  if (error || !data) return lenses;
  const custom = (
    data as {
      lens_id: string;
      name: string;
      weight: number;
      extra_note_label: string;
      questions: string[];
    }[]
  ).map((row): CustomLensDef => ({
    id: row.lens_id,
    name: row.name,
    weight: row.weight,
    extraNoteLabel: row.extra_note_label,
    questions: row.questions,
  }));
  return [...lenses, ...custom.map(buildCustomLens)];
}
