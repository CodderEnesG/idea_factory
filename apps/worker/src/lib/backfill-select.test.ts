import { describe, it, expect } from "vitest";
import type { Signal, SignalKind } from "@idea-factory/core";
import { selectCandidates, NEUTRAL_TRIAGE_SCORE } from "./backfill-select.js";

function sig(
  id: string,
  enrichment: Record<string, unknown> | null,
): Signal {
  return {
    id,
    source: "tldr",
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "özet",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: `h-${id}`,
    enrichment,
  } as unknown as Signal;
}

/** enrich.ts'in yazdığı geçerli StoredEnrichment şekli (yalnız test için gereken alanlar). */
function enr(kind: SignalKind | null, triage: number | null): Record<string, unknown> {
  return {
    signal_kind: kind,
    project_summary: "özet",
    hq_country: null,
    markets: [],
    funding: { stage: null, amount: null, total_raised: null, investors: [] },
    target_users: null,
    traction: null,
    capital_intensity: "unknown",
    regulation_flags: [],
    wtp_signals: null,
    sector: null,
    market: null,
    fetch_ok: true,
    model: "gemini-3.5-flash",
    page_chars: 100,
    triage_score: triage,
    triage_reason: triage == null ? null : "gerekçe",
  };
}

describe("selectCandidates", () => {
  it("bu mercekte analizi olanı atlar", () => {
    const out = selectCandidates(
      [sig("a", enr("product", 70)), sig("b", enr("product", 70))],
      new Set(["a"]),
    );
    expect(out.map((c) => c.signal.id)).toEqual(["b"]);
  });

  it("kovalanamaz sinyali (essay/research/other) eler", () => {
    const out = selectCandidates(
      [sig("essay", enr("essay", 90)), sig("urun", enr("product", 10))],
      new Set(),
    );
    expect(out.map((c) => c.signal.id)).toEqual(["urun"]);
  });

  it("triage_score'a göre azalan sıralar", () => {
    const out = selectCandidates(
      [sig("dusuk", enr("product", 20)), sig("yuksek", enr("venture", 95)), sig("orta", enr("funding", 60))],
      new Set(),
    );
    expect(out.map((c) => c.signal.id)).toEqual(["yuksek", "orta", "dusuk"]);
  });

  it("triage edilmemiş satır nötr skorla kuyrukta kalır (kaybolmaz)", () => {
    const out = selectCandidates([sig("triagesiz", enr("product", null))], new Set());
    expect(out).toHaveLength(1);
    expect(out[0]?.score).toBe(NEUTRAL_TRIAGE_SCORE);
  });

  it("legacy satır (signal_kind null / şema geçmeyen) elenmez — sınıf bilinmiyor demek", () => {
    const out = selectCandidates(
      [sig("legacy", enr(null, null)), sig("bozuk", { alakasiz: true }), sig("bos", null)],
      new Set(),
    );
    expect(out.map((c) => c.signal.id).sort()).toEqual(["bos", "bozuk", "legacy"]);
  });

  it("eşit skorda giriş sırasını (tazelik) korur", () => {
    const out = selectCandidates(
      [sig("yeni", enr("product", 50)), sig("eski", enr("product", 50))],
      new Set(),
    );
    expect(out.map((c) => c.signal.id)).toEqual(["yeni", "eski"]);
  });
});
