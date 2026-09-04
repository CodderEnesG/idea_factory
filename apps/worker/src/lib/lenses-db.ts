import { buildCustomLens, type CustomLensDef, type Lens } from "@idea-factory/core";
import { db } from "../db.js";

interface LensRow {
  lens_id: string;
  name: string;
  weight: number;
  extra_note_label: string;
  questions: string[];
  grounding?: boolean;
}

/** `/admin/mercekler`de eklenmiş aktif admin-mercekleri, çalışan `Lens`lere derlenmiş. */
export async function loadActiveCustomLenses(): Promise<Lens[]> {
  const BASE = "lens_id, name, weight, extra_note_label, questions";
  // 0015 henüz uygulanmadıysa grounding'siz oku (bkz. apps/web/lib/pg-compat.ts'teki gerekçe).
  let res = (await db.from("lenses").select(`${BASE}, grounding`).eq("active", true)) as {
    data: LensRow[] | null;
    error: { code?: string; message: string } | null;
  };
  if (res.error?.code === "42703") {
    console.warn("[lenses-db] 0015 uygulanmamış — grounding kolonu olmadan okunuyor");
    res = (await db.from("lenses").select(BASE).eq("active", true)) as typeof res;
  }
  const { data, error } = res;
  if (error || !data) return [];
  return data.map((row) => {
    const def: CustomLensDef = {
      id: row.lens_id,
      name: row.name,
      weight: row.weight,
      extraNoteLabel: row.extra_note_label,
      questions: row.questions,
      grounding: row.grounding ?? false,
    };
    return buildCustomLens(def);
  });
}
