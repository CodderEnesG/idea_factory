import { buildCustomLens, type CustomLensDef, type Lens } from "@idea-factory/core";
import { db } from "../db.js";

interface LensRow {
  lens_id: string;
  name: string;
  weight: number;
  extra_note_label: string;
  questions: string[];
}

/** `/admin/mercekler`de eklenmiş aktif admin-mercekleri, çalışan `Lens`lere derlenmiş. */
export async function loadActiveCustomLenses(): Promise<Lens[]> {
  const { data, error } = await db
    .from("lenses")
    .select("lens_id, name, weight, extra_note_label, questions")
    .eq("active", true);
  if (error || !data) return [];
  return (data as LensRow[]).map((row) => {
    const def: CustomLensDef = {
      id: row.lens_id,
      name: row.name,
      weight: row.weight,
      extraNoteLabel: row.extra_note_label,
      questions: row.questions,
    };
    return buildCustomLens(def);
  });
}
