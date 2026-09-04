import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

// Resmî Algolia HN arama API'si (rate limitsiz, kimlik doğrulama gerektirmez). `show_hn` etiketi
// kendi ürününü/projesini tanıtan kurucu gönderileri — GojiberryAI'ı bulan tldr:founders'a en
// yakın HN karşılığı (kanıtlanmış, küçük ekip, "ben yaptım" hikayeleri), ürün-lansmanı gürültüsü
// (producthunt'ın düşük isabet sorunu) yerine kurucunun kendi metniyle (story_text) geliyor.
const API_URL = "http://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=30";

interface HnHit {
  objectID?: string;
  title?: string;
  url?: string | null;
  story_text?: string | null;
  created_at?: string;
}

interface HnResponse {
  hits?: HnHit[];
}

export const hackernews: Source = {
  name: "hackernews",
  async fetch(): Promise<Signal[]> {
    const res = await fetch(API_URL, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; IdeaFactory/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`hackernews: HTTP ${res.status}`);
    const data = (await res.json()) as HnResponse;
    const now = new Date().toISOString();
    const out: Signal[] = [];

    for (const hit of data.hits ?? []) {
      const title = hit.title?.trim();
      const id = hit.objectID?.trim();
      if (!title || !id) continue;
      // Metin-yalnız "Show HN" gönderisi (harici link yok) → tartışma sayfasına düş.
      const url = hit.url?.trim() || `https://news.ycombinator.com/item?id=${id}`;
      const summary = hit.story_text?.trim() ?? "";

      const parsed = SignalSchema.safeParse({
        id: shortHash(url),
        source: "hackernews",
        type: "launch",
        title,
        url,
        summary_raw: summary,
        market: null,
        sector: null,
        posted_at: hit.created_at ?? null,
        fetched_at: now,
        content_hash: shortHash(`${title}\n${summary}`),
      } satisfies Record<string, unknown>);

      if (parsed.success) out.push(parsed.data);
      else console.warn(`[hackernews] şemaya uymadı, atlandı: ${url} — ${parsed.error.message}`);
    }
    return out;
  },
};
