import { buildCustomLens, lenses, type CustomLensDef, type Lens } from "@idea-factory/core";
import { serverDb } from "./supabase";
import { isMissingColumn } from "./pg-compat";

/** Builtin mercekler + `/admin/mercekler`de eklenmiş aktif admin-mercekleri.
 *  `/queue`, `/harita`, `/trend` paylaşır — composite() ağırlığının custom mercekleri de
 *  doğru saymasını sağlamak için hepsi bu tam kayıt defterini kullanmalı (bkz. ranker.ts). */
export async function loadLensRegistry(): Promise<Lens[]> {
  const db = serverDb();
  if (!db) return lenses;
  const BASE = "lens_id, name, weight, extra_note_label, questions";
  type Row = {
    lens_id: string;
    name: string;
    weight: number;
    extra_note_label: string;
    questions: string[];
    grounding?: boolean;
  };
  let res = (await db.from("lenses").select(`${BASE}, grounding`).eq("active", true)) as {
    data: Row[] | null;
    error: { code?: string; message: string } | null;
  };
  // 0015 henüz uygulanmadıysa grounding'siz oku — aksi halde mercek listesi tamamen boşalır
  // ve ağırlığı 0 olan beyaz-alan kompozit skora karışmaya başlar (bkz. pg-compat.ts).
  if (isMissingColumn(res.error)) {
    console.warn("[load-lens-registry] 0015 uygulanmamış — grounding kolonu olmadan okunuyor");
    res = (await db.from("lenses").select(BASE).eq("active", true)) as typeof res;
  }
  const { data, error } = res;
  if (error) {
    console.error("[load-lens-registry] sorgu hatası:", error.message);
    return lenses;
  }
  if (!data) return lenses;
  const custom = data.map((row): CustomLensDef => ({
    id: row.lens_id,
    name: row.name,
    weight: row.weight,
    extraNoteLabel: row.extra_note_label,
    questions: row.questions,
    grounding: row.grounding ?? false,
  }));
  return [...lenses, ...custom.map(buildCustomLens)];
}
