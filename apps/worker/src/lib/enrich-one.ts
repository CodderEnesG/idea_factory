import { parse } from "node-html-parser";
import {
  enrichSignal,
  StoredEnrichmentSchema,
  type Signal,
  type StoredEnrichment,
  type ThesisConfig,
} from "@idea-factory/core";
import { db } from "../db.js";
import { env } from "../env.js";

const MAX_CHARS = Number(process.env["ENRICH_MAX_CHARS"] ?? "18000");
const FETCH_TIMEOUT_MS = Number(process.env["ENRICH_FETCH_TIMEOUT_MS"] ?? "15000");
const UA = "Mozilla/5.0 (compatible; IdeaFactory/1.0)";

/** Sayfa metnini çek: timeout, UA, yalnız text/html; her hata → null (asla throw). */
export async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    const root = parse(await res.text());
    for (const sel of ["script", "style", "noscript", "svg", "iframe"]) {
      root.querySelectorAll(sel).forEach((n) => n.remove());
    }
    const text = root.text.replace(/\s+/g, " ").trim();
    return text.length > 0 ? text.slice(0, MAX_CHARS) : null;
  } catch {
    return null;
  }
}

/**
 * Tek sinyali zenginleştirip `signals.enrichment`'a yazar. `enrich.ts` (yeni sinyaller) ve
 * `reassess.ts` (geriye dönük yeniden değerlendirme) aynı adımı paylaşır.
 *
 * `prevEnrichment`: satırın mevcut ham jsonb'si. Yeniden zenginleştirmede triage skoru
 * korunur — sıfırlanırsa analiz önceliği sessizce "nötr"e düşer.
 * Hata yutulur (loglanır, null döner): enriched_at dokunulmaz, sonraki koşu yeniden dener.
 */
export async function enrichOne(
  signal: Signal,
  prevEnrichment: unknown,
  thesis: ThesisConfig,
): Promise<StoredEnrichment | null> {
  try {
    const text = await fetchPageText(signal.url);
    const extraction = await enrichSignal(signal, text, { thesis });
    const prev = StoredEnrichmentSchema.safeParse(prevEnrichment);
    const stored: StoredEnrichment = {
      ...extraction,
      fetch_ok: text !== null,
      model: env.analysisModel(),
      page_chars: text?.length ?? null,
      triage_score: prev.success ? prev.data.triage_score : null,
      triage_reason: prev.success ? prev.data.triage_reason : null,
    };
    const patch: Record<string, unknown> = {
      enrichment: stored,
      enriched_at: new Date().toISOString(),
    };
    if (!signal.market && extraction.market) patch["market"] = extraction.market;
    if (!signal.sector && extraction.sector) patch["sector"] = extraction.sector;

    const { error } = await db.from("signals").update(patch).eq("id", signal.id);
    if (error) throw new Error(error.message);
    console.log(
      `  ✓ ${text ? `${text.length}ch` : "sayfa yok"} · ${extraction.signal_kind} · ` +
        `${extraction.audience_breadth}/${extraction.pitch_clarity} — ${signal.title.slice(0, 55)}`,
    );
    return stored;
  } catch (e) {
    console.error(`  ✗ ${signal.url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}
