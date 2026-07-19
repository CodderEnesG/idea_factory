import { describe, it, expect } from "vitest";
import type { Signal } from "@idea-factory/core";
import { dedupeBatch, quote } from "./dedupe.js";

function sig(over: Partial<Signal>): Signal {
  return {
    id: "id-1",
    source: "producthunt",
    type: "launch",
    title: "Bir ürün",
    url: "https://x/1",
    summary_raw: "özet",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: "hash-1",
    ...over,
  } as Signal;
}

describe("dedupeBatch", () => {
  it("aynı url'den ilk görüleni tutar", () => {
    const out = dedupeBatch([
      sig({ id: "a", url: "https://x/1", content_hash: "h1" }),
      sig({ id: "b", url: "https://x/1", content_hash: "h2" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["a"]);
  });

  it("farklı url ama aynı içerik hash'i de mükerrerdir", () => {
    const out = dedupeBatch([
      sig({ id: "a", url: "https://x/1", content_hash: "h1" }),
      sig({ id: "b", url: "https://x/2", content_hash: "h1" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["a"]);
  });

  it("benzersizlere dokunmaz, sırayı korur", () => {
    const out = dedupeBatch([
      sig({ id: "a", url: "https://x/1", content_hash: "h1" }),
      sig({ id: "b", url: "https://x/2", content_hash: "h2" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("boş girişte boş çıkar", () => {
    expect(dedupeBatch([])).toEqual([]);
  });
});

describe("quote", () => {
  it("değeri çift tırnağa alır (virgül/parantez PostgREST'i bozmasın)", () => {
    expect(quote("https://x/a,b(c)")).toBe('"https://x/a,b(c)"');
  });

  it("içteki çift tırnağı kaçırır", () => {
    expect(quote('a"b')).toBe('"a\\"b"');
  });
});
