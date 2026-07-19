import Parser from "rss-parser";
import { SignalSchema, shortHash, type Signal, type SignalType } from "@idea-factory/core";
import type { Source } from "./types.js";

/**
 * WordPress tarzı düz RSS feed → Signal listesi. Yeni WP kaynağı = tek çağrı
 * (webrazzi.ts / techcrunch.ts örnekleri). Sayfa gövdesi enrich aşamasında çekilir;
 * burada yalnız feed alanları normalize edilir.
 */
export function wpFeed(opts: {
  name: string; // Source.name ve Signal.source
  url: string;
  market?: string | null;
  inferType: (title: string, categories: string[]) => SignalType;
}): Source {
  return {
    name: opts.name,
    async fetch(): Promise<Signal[]> {
      const parser = new Parser({ timeout: 20_000 });
      const feed = await parser.parseURL(opts.url);
      const now = new Date().toISOString();
      const out: Signal[] = [];

      for (const item of feed.items) {
        const url = item.link?.trim();
        const title = item.title?.trim();
        if (!url || !title) continue;

        const summary = (item.contentSnippet ?? "").replace(/\s+/g, " ").trim();
        const categories = (item.categories ?? []).map((c) =>
          typeof c === "string" ? c : ((c as { _?: string })._ ?? ""),
        );

        const parsed = SignalSchema.safeParse({
          id: shortHash(url),
          source: opts.name,
          type: opts.inferType(title, categories),
          title,
          url,
          summary_raw: summary,
          market: opts.market ?? null,
          sector: null,
          posted_at: item.isoDate ?? null,
          fetched_at: now,
          content_hash: shortHash(`${title}\n${summary}`),
        });
        if (parsed.success) out.push(parsed.data);
        else console.warn(`[${opts.name}] şemaya uymadı, atlandı: ${url}`);
      }
      return out;
    },
  };
}
