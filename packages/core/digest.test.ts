import { describe, it, expect } from "vitest";
import { buildDigest } from "./digest.js";
import type { RankedItem } from "./ranker.js";
import type { ArbitrageAnalysis } from "./lenses.config.js";
import type { Signal } from "./signal.js";

function item(id: string, fit: number, validation = false): RankedItem {
  const action = fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill";
  const signal: Signal = {
    id,
    source: "test",
    type: "launch",
    title: `Sinyal ${id}`,
    url: `https://x/${id}`,
    summary_raw: "",
    market: "US",
    sector: "B2B SaaS",
    posted_at: null,
    fetched_at: "2026-01-01T00:00:00Z",
    content_hash: id,
  };
  const analysis: ArbitrageAnalysis = {
    lens: "arbitrage",
    fit,
    rationale: `gerekçe ${id}`,
    evidence: fit >= 80 ? [{ fact: "f", source: "s" }] : [],
    adaptation_notes: "uyarlama notu",
    risks: ["risk1"],
    confidence: fit >= 80 ? "high" : "med",
    validation_needed: validation
      ? [{ data: "eksik veri", why: "kritik", how_to_verify: "mülakat" }]
      : action === "pursue"
        ? []
        : [{ data: "d", why: "w", how_to_verify: "h" }],
    recommended_action: action,
    tags: [],
  };
  return { signal, analyses: { arbitrage: analysis } };
}

describe("buildDigest", () => {
  it("kovala bandı başlığı içerir, ele bandını hariç tutar", () => {
    const md = buildDigest([item("a", 90), item("b", 20)]);
    expect(md).toContain("KOVALA");
    expect(md).toContain("Sinyal a");
    expect(md).not.toContain("Sinyal b"); // kill shortlist'e girmez
  });

  it("doğrulama bekleyenler bölümü üretir", () => {
    const md = buildDigest([item("c", 60, true)]);
    expect(md).toContain("Doğrulama Bekleyenler");
    expect(md).toContain("eksik veri");
  });

  it("topN sınırına uyar", () => {
    const items = Array.from({ length: 5 }, (_, i) => item(`p${i}`, 85));
    const md = buildDigest(items, { topN: 2 });
    const count = (md.match(/## 🟢 KOVALA/g) ?? []).length;
    expect(count).toBe(2);
  });
});
