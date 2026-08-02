import { describe, it, expect } from "vitest";
import type { Signal } from "@idea-factory/core";
import { buildNotes, type CommentRow, type DecisionRow } from "./knowledge.js";

function sig(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "s0",
    source: "producthunt",
    type: "launch",
    title: "Yeni Ürün",
    url: "https://x/s0",
    summary_raw: "özet",
    market: "TR",
    sector: "fintech",
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: "h-s0",
    ...overrides,
  } as Signal;
}

function decision(overrides: Partial<DecisionRow> = {}): DecisionRow {
  return {
    decision: "pursue",
    note: null,
    decided_by: "enes",
    created_at: "2026-01-01T00:00:00Z",
    signal: { id: "s1", title: "Benzer Ürün", sector: "fintech", market: "TR" },
    ...overrides,
  } as DecisionRow;
}

function comment(overrides: Partial<CommentRow> = {}): CommentRow {
  return {
    body: "bunu daha önce denemiştik",
    author: "enes",
    created_at: "2026-01-01T00:00:00Z",
    signal: { id: "s1", title: "Benzer Ürün", sector: "fintech", market: "TR" },
    ...overrides,
  } as CommentRow;
}

describe("buildNotes", () => {
  it("aynı sektördeki kararı ve yorumu notlara ekler", () => {
    const notes = buildNotes(sig(), [decision()], [comment()]);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toContain("enes");
    expect(notes[0]).toContain("pursue");
    expect(notes[1]).toContain("bunu daha önce denemiştik");
  });

  it("farklı sektör ve pazardaki satırları eler", () => {
    const notes = buildNotes(
      sig(),
      [decision({ signal: { id: "s2", title: "İlgisiz", sector: "e-ticaret", market: "US" } })],
      [],
    );
    expect(notes).toEqual([]);
  });

  it("pazar eşleşmesi sektör eşleşmesi olmasa da yeterlidir", () => {
    const notes = buildNotes(
      sig({ sector: "e-ticaret", market: "TR" }),
      [decision({ signal: { id: "s2", title: "Farklı Sektör", sector: "fintech", market: "TR" } })],
      [],
    );
    expect(notes).toHaveLength(1);
  });

  it("büyük/küçük harf ve boşluk farkına rağmen tam eşleşme sayar", () => {
    const notes = buildNotes(
      sig({ sector: "Fintech" }),
      [decision({ signal: { id: "s2", title: "X", sector: "  fintech ", market: null } })],
      [],
    );
    expect(notes).toHaveLength(1);
  });

  it("kelime örtüşmesiyle alt-küme sektörleri eşleştirir (SaaS ↔ B2B SaaS)", () => {
    const notes = buildNotes(
      sig({ sector: "SaaS", market: null }),
      [decision({ signal: { id: "s2", title: "X", sector: "B2B SaaS", market: null } })],
      [],
    );
    expect(notes).toHaveLength(1);
  });

  it("hiç ortak kelime yoksa eşleşmez (yalnız alt-dizge değil, kelime bazlı)", () => {
    const notes = buildNotes(
      sig({ sector: "AI", market: null }),
      [decision({ signal: { id: "s2", title: "X", sector: "Retail", market: null } })],
      [],
    );
    expect(notes).toEqual([]);
  });

  it("önce alaka puanına göre sıralar — daha eski ama tam eşleşen, daha yeni kısmi eşleşmenin önüne geçer", () => {
    const notes = buildNotes(
      sig({ sector: "fintech", market: "TR" }),
      [
        decision({
          decided_by: "eski",
          created_at: "2020-01-01T00:00:00Z",
          signal: { id: "tam", title: "Tam Eşleşme", sector: "fintech", market: "TR" }, // skor 6
        }),
        decision({
          decided_by: "yeni",
          created_at: "2026-06-01T00:00:00Z",
          signal: { id: "kismi", title: "Kısmi", sector: "B2B fintech", market: "US" }, // skor 1
        }),
      ],
      [],
    );
    expect(notes[0]).toContain("Tam Eşleşme");
    expect(notes[1]).toContain("Kısmi");
  });

  it("eşit alaka puanında tazelik tiebreak yapar", () => {
    const notes = buildNotes(
      sig(),
      [
        decision({
          decided_by: "eski",
          created_at: "2020-01-01T00:00:00Z",
          signal: { id: "eski-sinyal", title: "Eski", sector: "fintech", market: "TR" },
        }),
        decision({
          decided_by: "yeni",
          created_at: "2026-06-01T00:00:00Z",
          signal: { id: "yeni-sinyal", title: "Yeni", sector: "fintech", market: "TR" },
        }),
      ],
      [],
    );
    expect(notes[0]).toContain("Yeni");
    expect(notes[1]).toContain("Eski");
  });

  it("aynı (ilgili-sinyal, kullanıcı) için yalnız en-yeni kararı sayar", () => {
    const notes = buildNotes(
      sig(),
      [
        decision({ decision: "watch", decided_by: "enes", created_at: "2020-01-01T00:00:00Z" }),
        decision({ decision: "pursue", decided_by: "enes", created_at: "2026-01-01T00:00:00Z" }),
      ],
      [],
    );
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("pursue");
  });

  it("farklı kullanıcıların aynı sinyaldeki kararlarını ayrı ayrı tutar", () => {
    const notes = buildNotes(
      sig(),
      [decision({ decided_by: "enes" }), decision({ decided_by: "aylin", decision: "kill" })],
      [],
    );
    expect(notes).toHaveLength(2);
  });

  it("sinyalin sektörü de pazarı da yoksa boş döner", () => {
    const notes = buildNotes(sig({ sector: null, market: null }), [decision()], [comment()]);
    expect(notes).toEqual([]);
  });

  it("ilişkili sinyal null ise satırı atlar", () => {
    const notes = buildNotes(sig(), [decision({ signal: null })], [comment({ signal: null })]);
    expect(notes).toEqual([]);
  });

  it("MAX_NOTES tavanını aşmaz", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      decision({
        decided_by: `kişi${i}`,
        signal: { id: `s${i}`, title: `Ürün ${i}`, sector: "fintech", market: "TR" },
      }),
    );
    const notes = buildNotes(sig(), rows, []);
    expect(notes.length).toBe(8);
  });
});
