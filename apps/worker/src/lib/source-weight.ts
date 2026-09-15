import { db } from "../db.js";
import { computeSourceWeights } from "./source-weight-calc.js";

/**
 * Kaynak-verim ağırlığı: LLM analiz bütçesi kıt (analyze.ts/backfill-lens.ts kaynak başı
 * tavanlı, ama tavan tüm kaynaklara eşit). Ölçüm (2026-09-04): techcrunch fit≥80 oranı
 * producthunt'ın ~5 katı, ycombinator 134 analizde tek bir fit≥80 bile üretmedi. Sabit eşit
 * tavan bu farkı görmezden geliyor. Bu modül `triage_score`'u kaynağın tarihsel fit≥80
 * oranıyla ağırlıklandırır — kaynağı ELEMEZ (yeni eklenen kaynaklar hâlâ örneklem topluyor),
 * yalnız kıt bütçede sıra önceliğini kaydırır. Saf hesap: `source-weight-calc.ts`.
 */

/** DB'den son N sinyalin kaynak+en-iyi-fit'ini çekip ağırlık haritasını üretir.
 *  Hiç veri yoksa (ör. testte/boş DB'de) boş map döner — çağıran taraf weight=1 varsaymalı. */
export async function loadSourceWeights(limit = 3000): Promise<Map<string, number>> {
  const { data: sigs, error: sigErr } = await db
    .from("signals")
    .select("id,source")
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (sigErr) throw new Error(`signals sorgu hatası (source-weight): ${sigErr.message}`);

  const { data: analyses, error: anErr } = await db.from("analyses").select("signal_id,fit");
  if (anErr) throw new Error(`analyses sorgu hatası (source-weight): ${anErr.message}`);

  const bestFit = new Map<string, number>();
  for (const a of analyses ?? []) {
    const sid = a["signal_id"] as string;
    const fit = a["fit"] as number;
    const cur = bestFit.get(sid);
    if (cur === undefined || fit > cur) bestFit.set(sid, fit);
  }

  const rows: { source: string; bestFit: number }[] = [];
  for (const s of sigs ?? []) {
    const fit = bestFit.get(s.id as string);
    if (fit !== undefined) rows.push({ source: s.source as string, bestFit: fit });
  }
  return computeSourceWeights(rows);
}
