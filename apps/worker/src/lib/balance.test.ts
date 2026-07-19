import { describe, it, expect } from "vitest";
import type { Signal } from "@idea-factory/core";
import { balanceBySource } from "./balance.js";

function sig(id: string, source: string): Signal {
  return {
    id,
    source,
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "özet",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: `h-${id}`,
  } as Signal;
}

describe("balanceBySource", () => {
  it("tek kaynak partiyi domine edemez (tavan uygulanır)", () => {
    const signals = [
      ...["a1", "a2", "a3", "a4", "a5", "a6"].map((id) => sig(id, "tldr")),
      ...["b1", "b2", "b3"].map((id) => sig(id, "producthunt")),
    ];
    const out = balanceBySource(signals, 6, 4);
    expect(out.filter((s) => s.source === "tldr").length).toBe(4);
    expect(out.filter((s) => s.source === "producthunt").length).toBe(2);
  });

  it("parti dolmazsa tavanı aşan artıklarla tamamlar", () => {
    const signals = ["a1", "a2", "a3", "a4", "a5"].map((id) => sig(id, "tldr"));
    const out = balanceBySource(signals, 5, 2);
    expect(out.length).toBe(5); // tek kaynak var diye boş geçmesin
  });

  it("limit'i asla aşmaz ve sırayı korur", () => {
    const signals = [sig("a1", "s1"), sig("b1", "s2"), sig("a2", "s1"), sig("b2", "s2")];
    const out = balanceBySource(signals, 3, 4);
    expect(out.map((s) => s.id)).toEqual(["a1", "b1", "a2"]);
  });

  it("boş girişte boş çıkar", () => {
    expect(balanceBySource([], 10, 4)).toEqual([]);
  });
});
