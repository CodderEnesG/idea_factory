import type { Signal } from "@idea-factory/core";

/** Batch içi dedup: url + content_hash üzerinden ilk görüleni tut. */
export function dedupeBatch(signals: Signal[]): Signal[] {
  const seenUrl = new Set<string>();
  const seenHash = new Set<string>();
  const out: Signal[] = [];
  for (const s of signals) {
    if (seenUrl.has(s.url) || seenHash.has(s.content_hash)) continue;
    seenUrl.add(s.url);
    seenHash.add(s.content_hash);
    out.push(s);
  }
  return out;
}

/** PostgREST .or() filtresi için değer kaçışı (virgül/parantez içeren url'ler). */
export function quote(v: string): string {
  return `"${v.replace(/"/g, '\\"')}"`;
}
