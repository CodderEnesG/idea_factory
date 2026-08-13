import { describe, it, expect } from "vitest";
import type { Signal } from "@idea-factory/core";
import { limitPerSource } from "./limit-per-source.js";

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

describe("limitPerSource", () => {
  it("limit <= 0 ise sınırsız, dokunmaz", () => {
    const rows = [sig({ id: "a" }), sig({ id: "b" })];
    expect(limitPerSource(rows, 0)).toBe(rows);
    expect(limitPerSource(rows, -1)).toBe(rows);
  });

  it("satır sayısı zaten limitin altındaysa dokunmaz", () => {
    const rows = [sig({ id: "a" })];
    expect(limitPerSource(rows, 5)).toBe(rows);
  });

  it("en yeni posted_at'e göre kırpar", () => {
    const rows = [
      sig({ id: "old", posted_at: "2026-01-01T00:00:00Z" }),
      sig({ id: "new", posted_at: "2026-03-01T00:00:00Z" }),
      sig({ id: "mid", posted_at: "2026-02-01T00:00:00Z" }),
    ];
    expect(limitPerSource(rows, 2).map((s) => s.id)).toEqual(["new", "mid"]);
  });

  it("posted_at null olanları en eski sayar", () => {
    const rows = [
      sig({ id: "null1", posted_at: null }),
      sig({ id: "dated", posted_at: "2026-01-01T00:00:00Z" }),
    ];
    expect(limitPerSource(rows, 1).map((s) => s.id)).toEqual(["dated"]);
  });
});
