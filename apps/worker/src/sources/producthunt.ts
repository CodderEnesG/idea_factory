import Parser from "rss-parser";
import { parse } from "node-html-parser";
import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

const FEED_URL = "https://www.producthunt.com/feed";

/**
 * Feed content'i: <p>tagline</p><p><a>Discussion</a> | <a>Link</a></p>.
 * contentSnippet ikisini birleştirip "Discussion | Link" bırakıyordu — sinyaller içeriksiz
 * kalıyor, enrich de PH sayfasını çekemiyordu (Cloudflare 403). İlk <p> = gerçek tagline.
 */
function extractTagline(content: string | undefined): string {
  if (!content) return "";
  const p = parse(content).querySelectorAll("p");
  for (const node of p) {
    // Discussion|Link paragrafını atla (yalnız anchor içerir).
    if (node.querySelector("a")) continue;
    const t = node.text.replace(/\s+/g, " ").trim();
    if (t) return t;
  }
  return "";
}

/** ProductHunt RSS — flat feed, tek-adım. Walking skeleton kaynağı (M1). */
export const productHunt: Source = {
  name: "producthunt",
  async fetch(): Promise<Signal[]> {
    const parser = new Parser({ timeout: 20_000 });
    const feed = await parser.parseURL(FEED_URL);
    const now = new Date().toISOString();
    const out: Signal[] = [];

    for (const item of feed.items) {
      const url = item.link?.trim();
      const title = item.title?.trim();
      if (!url || !title) continue;

      const summary = extractTagline(item.content) || (item.contentSnippet ?? "").trim();
      if (!summary) {
        console.warn(`[producthunt] tagline yok, atlandı: ${url}`);
        continue;
      }
      const parsed = SignalSchema.safeParse({
        id: shortHash(url),
        source: "producthunt",
        type: "launch",
        title,
        url,
        summary_raw: summary,
        market: null,
        sector: null,
        posted_at: item.isoDate ?? null,
        fetched_at: now,
        content_hash: shortHash(`${title}\n${summary}`),
      } satisfies Record<string, unknown>);

      if (parsed.success) out.push(parsed.data);
      else console.warn(`[producthunt] geçersiz sinyal atlandı: ${url} — ${parsed.error.message}`);
    }
    return out;
  },
};
