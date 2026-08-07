import { describe, expect, it } from "vitest";
import { isBench, benchItems } from "./bench.js";
import type { RankedItem } from "./ranker.js";
import type { ArbitrageAnalysis } from "./lenses.config.js";
import type { Signal } from "./signal.js";

function mkItem(fit: number, confidence: ArbitrageAnalysis["confidence"]): RankedItem {
  const signal: Signal = {
    id: `s${fit}${confidence}`,
    source: "test",
    type: "launch",
    title: "t",
    url: `https://x.test/${fit}/${confidence}`,
    summary_raw: "",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: new Date().toISOString(),
    content_hash: "h",
  };
  const analysis: ArbitrageAnalysis = {
    lens: "arbitrage",
    fit,
    rationale: "r",
    evidence: [],
    adaptation_notes: "",
    risks: [],
    confidence,
    validation_needed: [],
    recommended_action: fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill",
    tags: [],
  };
  return { signal, analyses: { arbitrage: analysis } };
}

describe("isBench", () => {
  it("fit ≥ 80 + high geçer", () => {
    expect(isBench({ fit: 80, confidence: "high" })).toBe(true);
    expect(isBench({ fit: 95, confidence: "high" })).toBe(true);
  });

  it("fit 79 veya güven high değilse geçmez", () => {
    expect(isBench({ fit: 79, confidence: "high" })).toBe(false);
    expect(isBench({ fit: 90, confidence: "med" })).toBe(false);
    expect(isBench({ fit: 90, confidence: "low" })).toBe(false);
  });
});

describe("benchItems", () => {
  it("yalnız çıtayı geçenleri döndürür", () => {
    const items = [mkItem(85, "high"), mkItem(85, "med"), mkItem(60, "high"), mkItem(30, "low")];
    const out = benchItems(items);
    expect(out).toHaveLength(1);
    expect(out[0].analyses["arbitrage"]?.fit).toBe(85);
    expect(out[0].analyses["arbitrage"]?.confidence).toBe("high");
  });
});
