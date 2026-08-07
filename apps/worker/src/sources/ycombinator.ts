import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

// PLAN.md'nin faz-1 kapsamına yazılan ama RSS/API yok denip 404'te bırakılan kaynak
// (2026-07-19). Meğer scrape gerekmiyormuş: bu URL'e düz GET atınca Content-Type:
// application/json dönüyor — sayfanın kendisi zaten bir JSON API (Algolia arkada,
// ama ön uçtaki bu URL doğrudan JSON veriyor). HTML parse/headless tarayıcı gerekmez.
const API_URL = "https://www.ycombinator.com/launches";

interface YcHit {
  title?: string;
  tagline?: string;
  created_at?: string;
  company?: { industry?: string };
  search_path?: string;
}

interface YcResponse {
  hits?: YcHit[];
}

/** YC Launches — en yeni ~20 lansman, sıralı geliyor (isteğe bağlı sayfalama yok, v1 için yeter). */
export const ycombinator: Source = {
  name: "ycombinator",
  async fetch(): Promise<Signal[]> {
    const res = await fetch(API_URL, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; IdeaFactory/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`ycombinator: HTTP ${res.status}`);
    const data = (await res.json()) as YcResponse;
    const now = new Date().toISOString();
    const out: Signal[] = [];

    for (const hit of data.hits ?? []) {
      const title = hit.title?.trim();
      const url = hit.search_path?.trim(); // API zaten tam URL döndürüyor, önek ekleme.
      if (!title || !url) continue;
      const summary = hit.tagline?.trim() ?? "";

      const parsed = SignalSchema.safeParse({
        id: shortHash(url),
        source: "ycombinator",
        type: "launch",
        title,
        url,
        summary_raw: summary,
        market: null,
        sector: hit.company?.industry?.trim() || null,
        posted_at: hit.created_at ?? null,
        fetched_at: now,
        content_hash: shortHash(`${title}\n${summary}`),
      } satisfies Record<string, unknown>);

      if (parsed.success) out.push(parsed.data);
      else console.warn(`[ycombinator] şemaya uymadı, atlandı: ${url} — ${parsed.error.message}`);
    }
    return out;
  },
};
