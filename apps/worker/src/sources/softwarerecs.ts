import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

// Resmî Stack Exchange API v2.3 (anahtarsız günlük 300 istek; tek istek atıyoruz). Software
// Recommendations sitesi = insanların "şunu yapan bir araç var mı?" diye sorduğu yer; oy alan
// ve hâlâ kabul edilmiş yanıtı olmayan sorular karşılanmamış ihtiyaç sinyalidir.
const WINDOW_DAYS = 45;

interface SeQuestion {
  question_id?: number;
  title?: string;
  link?: string;
  score?: number;
  answer_count?: number;
  is_answered?: boolean;
  tags?: string[];
  body?: string;
  creation_date?: number;
}

export const softwarerecs: Source = {
  name: "softwarerecs",
  async fetch(): Promise<Signal[]> {
    const from = Math.floor((Date.now() - WINDOW_DAYS * 86_400_000) / 1000);
    const url =
      `https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&site=softwarerecs` +
      `&fromdate=${from}&pagesize=30&filter=withbody`;
    const res = await fetch(url, {
      headers: { "user-agent": "IdeaFactory/1.0", "accept-encoding": "gzip" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`softwarerecs: HTTP ${res.status}`);
    const data = (await res.json()) as { items?: SeQuestion[] };
    const now = new Date().toISOString();
    const out: Signal[] = [];

    for (const q of data.items ?? []) {
      const title = decode(q.title?.trim() ?? "");
      const link = q.link?.trim();
      if (!title || !link) continue;
      // Gövde HTML gelir; düz metne indirip kısalt.
      const body = decode((q.body ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 1200);
      const meta = `${q.score ?? 0} oy · ${q.answer_count ?? 0} yanıt · ${(q.tags ?? []).join(", ")}`;
      const summary = [body, meta].filter(Boolean).join("\n");

      const parsed = SignalSchema.safeParse({
        id: shortHash(link),
        source: "softwarerecs",
        type: "company",
        title,
        url: link,
        summary_raw: summary,
        market: null,
        sector: null,
        posted_at: q.creation_date ? new Date(q.creation_date * 1000).toISOString() : null,
        fetched_at: now,
        content_hash: shortHash(`${title}\n${summary}`),
      } satisfies Record<string, unknown>);

      if (parsed.success) out.push(parsed.data);
      else console.warn(`[softwarerecs] şemaya uymadı, atlandı: ${link} — ${parsed.error.message}`);
    }
    return out;
  },
};

/** Stack Exchange başlıkları HTML varlıklarıyla gelir (&#39; &quot; &amp;). */
function decode(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
