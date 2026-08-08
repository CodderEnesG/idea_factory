import type { BaseAnalysis, RankedItem, Signal } from "@idea-factory/core";
import { serverDb } from "./supabase";
import { DEMO_ITEMS } from "./demo";

/** Tüm merceklerin analiz satırlarını çeker, sinyal başına `analyses` haritasında gruplar.
 *  `/queue`, `/harita`, `/trend` paylaşır — Supabase env yoksa DEMO_ITEMS'a düşer. */
export async function loadItems(): Promise<{ items: RankedItem[]; demo: boolean }> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true };
  const { data, error } = await db.from("analyses").select("*, signals(*)");
  if (error || !data || data.length === 0) return { items: DEMO_ITEMS, demo: true };

  const bySignal = new Map<string, RankedItem>();
  for (const r of data) {
    const { signals, ...rest } = r as Record<string, unknown> & { signals?: Signal };
    if (!signals) continue;
    const analysis = rest as unknown as BaseAnalysis;
    const item = bySignal.get(signals.id);
    if (item) item.analyses[analysis.lens] = analysis;
    else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
  }
  return { items: [...bySignal.values()], demo: false };
}
