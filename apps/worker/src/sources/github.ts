import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

// Resmî GitHub Search API (REST v3). Anahtarsız 10 istek/dk yeter (tek istek atıyoruz);
// GITHUB_TOKEN varsa yalnız limiti yükseltmek için kullanılır. Ölçüt: son 14 günde açılmış ve
// hızla yıldız toplayan depolar — "insanlar bunu gerçekten istedi" sinyali, lansman gürültüsü değil.
const WINDOW_DAYS = 14;
const MIN_STARS = 60;

interface GhRepo {
  full_name?: string;
  html_url?: string;
  description?: string | null;
  stargazers_count?: number;
  language?: string | null;
  topics?: string[];
  created_at?: string;
}

export const github: Source = {
  name: "github",
  async fetch(): Promise<Signal[]> {
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
    const q = encodeURIComponent(`created:>${since} stars:>${MIN_STARS}`);
    const headers: Record<string, string> = {
      accept: "application/vnd.github+json",
      "user-agent": "IdeaFactory/1.0",
    };
    const token = process.env["GITHUB_TOKEN"];
    if (token) headers["authorization"] = `Bearer ${token}`;

    const res = await fetch(
      `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=30`,
      { headers, signal: AbortSignal.timeout(20_000) },
    );
    if (!res.ok) throw new Error(`github: HTTP ${res.status}`);
    const data = (await res.json()) as { items?: GhRepo[] };
    const now = new Date().toISOString();
    const out: Signal[] = [];

    for (const r of data.items ?? []) {
      const name = r.full_name?.trim();
      const url = r.html_url?.trim();
      if (!name || !url) continue;
      const desc = r.description?.trim() ?? "";
      const meta = [`${r.stargazers_count ?? 0} yıldız`, r.language, ...(r.topics ?? []).slice(0, 5)]
        .filter(Boolean)
        .join(" · ");
      const summary = [desc, meta].filter(Boolean).join("\n");

      const parsed = SignalSchema.safeParse({
        id: shortHash(url),
        source: "github",
        type: "launch",
        title: desc ? `${name}: ${desc}` : name,
        url,
        summary_raw: summary,
        market: null,
        sector: null,
        posted_at: r.created_at ?? null,
        fetched_at: now,
        content_hash: shortHash(`${name}\n${summary}`),
      } satisfies Record<string, unknown>);

      if (parsed.success) out.push(parsed.data);
      else console.warn(`[github] şemaya uymadı, atlandı: ${url} — ${parsed.error.message}`);
    }
    return out;
  },
};
