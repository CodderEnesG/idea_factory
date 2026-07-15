import { describe, it, expect } from "vitest";
import { rank, type RankedItem } from "./ranker.js";
import type { ArbitrageAnalysis } from "./lenses.config.js";
import type { Signal } from "./signal.js";

function sig(id: string, fetched: string): Signal {
  return {
    id,
    source: "test",
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: fetched,
    content_hash: id,
  };
}

function ana(fit: number): ArbitrageAnalysis {
  const action = fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill";
  return {
    lens: "arbitrage",
    fit,
    rationale: "r",
    evidence: fit >= 80 ? [{ fact: "f", source: "s" }] : [],
    adaptation_notes: "",
    risks: [],
    confidence: fit >= 80 ? "high" : "med",
    validation_needed: action === "pursue" ? [] : [{ data: "d", why: "w", how_to_verify: "h" }],
    recommended_action: action,
    tags: [],
  };
}

describe("rank", () => {
  it("bant önce sıralanır (pursue > watch > kill)", () => {
    const items: RankedItem[] = [
      { signal: sig("kill", "2026-01-01T00:00:00Z"), analysis: ana(30) },
      { signal: sig("watch", "2026-01-01T00:00:00Z"), analysis: ana(60) },
      { signal: sig("pursue", "2026-01-01T00:00:00Z"), analysis: ana(90) },
    ];
    expect(rank(items).map((r) => r.signal.id)).toEqual(["pursue", "watch", "kill"]);
  });

  it("bant içinde tazelik tiebreak — yeni önce", () => {
    const items: RankedItem[] = [
      { signal: sig("eski", "2026-01-01T00:00:00Z"), analysis: ana(85) },
      { signal: sig("yeni", "2026-06-01T00:00:00Z"), analysis: ana(82) },
    ];
    // ikisi de pursue bandı; tazelik kazanır → yeni (fit 82) eski (fit 85) önünde
    expect(rank(items).map((r) => r.signal.id)).toEqual(["yeni", "eski"]);
  });

  it("tazelik bandı geçemez — düşük-bant yeni, yüksek-bant eskiyi geçemez", () => {
    const items: RankedItem[] = [
      { signal: sig("watch-yeni", "2026-06-01T00:00:00Z"), analysis: ana(70) },
      { signal: sig("pursue-eski", "2026-01-01T00:00:00Z"), analysis: ana(85) },
    ];
    expect(rank(items).map((r) => r.signal.id)).toEqual(["pursue-eski", "watch-yeni"]);
  });
});
