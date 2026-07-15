import Parser from "rss-parser";
import { parse } from "node-html-parser";
import { SignalSchema, shortHash, type Signal, type SignalType } from "@idea-factory/core";
import type { Source } from "./types.js";

// Tez için en değerli TLDR feed'leri.
const CATEGORIES = (process.env["TLDR_CATEGORIES"] ?? "founders,ai,tech,product").split(",");
const UA = "Mozilla/5.0 (compatible; IdeaFactory/1.0)";

function inferType(title: string): SignalType {
  const t = title.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|\$\d/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

function stripUtm(url: string): string {
  try {
    const u = new URL(url);
    [...u.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

/** RSS ile bir kategorinin en yeni sayısının URL'ini bul. */
async function latestIssueUrl(parser: Parser, category: string): Promise<string | null> {
  const feed = await parser.parseURL(`https://tldr.tech/api/rss/${category}`);
  return feed.items[0]?.link ?? null;
}

/** Sayı sayfasını çek, tek tek haberleri (font-bold anchor + newsletter-html) parse et. */
async function parseIssue(issueUrl: string, category: string, now: string): Promise<Signal[]> {
  const res = await fetch(issueUrl, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`sayı çekilemedi ${issueUrl}: ${res.status}`);
  const root = parse(await res.text());
  const out: Signal[] = [];

  // açıklama blokları (doküman sırasıyla) — her haber, kendisinden sonraki ilk .newsletter-html
  const descs = root
    .querySelectorAll(".newsletter-html")
    .map((d) => ({ start: d.range?.[0] ?? 0, text: d.text.trim() }))
    .sort((a, b) => a.start - b.start);

  for (const a of root.querySelectorAll("a.font-bold")) {
    const rawTitle = a.text.trim();
    if (!/\(\d+\s*minute read\)/i.test(rawTitle)) continue; // sadece gerçek haber anchor'ları
    const href = a.getAttribute("href");
    if (!href) continue;

    const title = rawTitle.replace(/\s*\(\d+\s*minute read\)\s*$/i, "").trim();
    const url = stripUtm(href);
    const start = a.range?.[0] ?? 0;
    const desc = descs.find((d) => d.start > start)?.text ?? "";

    const parsed = SignalSchema.safeParse({
      id: shortHash(url),
      source: `tldr:${category}`,
      type: inferType(title),
      title,
      url,
      summary_raw: desc,
      market: null,
      sector: null,
      posted_at: null,
      fetched_at: now,
      content_hash: shortHash(`${title}\n${desc}`),
    });
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export const tldr: Source = {
  name: "tldr",
  async fetch(): Promise<Signal[]> {
    const parser = new Parser({ timeout: 20_000 });
    const now = new Date().toISOString();
    const all: Signal[] = [];
    for (const cat of CATEGORIES) {
      try {
        const issue = await latestIssueUrl(parser, cat.trim());
        if (!issue) continue;
        const rows = await parseIssue(issue, cat.trim(), now);
        console.log(`[tldr:${cat}] ${issue} → ${rows.length} haber`);
        all.push(...rows);
      } catch (e) {
        console.error(`[tldr:${cat}] hata:`, e instanceof Error ? e.message : e);
      }
    }
    return all;
  },
};
