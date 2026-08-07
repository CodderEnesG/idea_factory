import { describe, it, expect } from "vitest";
import { checkAnalysisGuards } from "./guards.js";
import { fitBand, type ArbitrageAnalysis } from "./lenses.config.js";

const base: ArbitrageAnalysis = {
  lens: "arbitrage",
  fit: 85,
  rationale: "kanıtlı model + net yerel wedge",
  evidence: [{ fact: "ABD'de hızlı büyüme", source: "https://example.com" }],
  adaptation_notes: "e-fatura entegrasyonu gerekir",
  risks: ["yerel oyuncular"],
  confidence: "high",
  validation_needed: [],
  recommended_action: "pursue",
  tags: [],
};

describe("fitBand", () => {
  it("bant sınırları", () => {
    expect(fitBand(80)).toBe("pursue");
    expect(fitBand(79)).toBe("watch");
    expect(fitBand(50)).toBe("watch");
    expect(fitBand(49)).toBe("kill");
    expect(fitBand(0)).toBe("kill");
  });
});

describe("checkAnalysisGuards", () => {
  it("geçerli pursue temiz geçer", () => {
    expect(checkAnalysisGuards(base)).toEqual([]);
  });

  it("geçerli watch (dolu validation_needed) temiz geçer", () => {
    const watch: ArbitrageAnalysis = {
      ...base,
      fit: 65,
      confidence: "med",
      recommended_action: "watch",
      validation_needed: [{ data: "yerel CAC", why: "modeli değiştirir", how_to_verify: "mülakat" }],
    };
    expect(checkAnalysisGuards(watch)).toEqual([]);
  });

  it("bant-aksiyon çelişkisi yakalanır (fit 85 + kill)", () => {
    const bad = { ...base, recommended_action: "kill" as const };
    expect(checkAnalysisGuards(bad).some((v) => v.includes("bant-aksiyon"))).toBe(true);
  });

  it("güven kapısı: 80+ ama high değil", () => {
    const bad: ArbitrageAnalysis = {
      ...base,
      confidence: "med",
      recommended_action: "pursue",
      validation_needed: [{ data: "x", why: "y", how_to_verify: "z" }],
    };
    expect(checkAnalysisGuards(bad).some((v) => v.includes("güven kapısı"))).toBe(true);
  });

  it("pursue kanıtsız reddedilir", () => {
    const bad = { ...base, evidence: [] };
    expect(checkAnalysisGuards(bad).some((v) => v.includes("kanıtsız"))).toBe(true);
  });

  it("atıfsız olgu reddedilir", () => {
    const bad = { ...base, evidence: [{ fact: "büyüme", source: "" }] };
    expect(checkAnalysisGuards(bad).some((v) => v.includes("atıfsız"))).toBe(true);
  });

  it("izle boş validation_needed ile geçersiz", () => {
    const bad: ArbitrageAnalysis = {
      ...base,
      fit: 60,
      confidence: "med",
      recommended_action: "watch",
      validation_needed: [],
    };
    const out = checkAnalysisGuards(bad);
    expect(out.some((v) => v.includes("izle"))).toBe(true);
  });
});

describe("ön kapı guard'ı (signal_kind)", () => {
  it("kovalanamaz sinyalde yüksek fit ihlal", () => {
    const v = checkAnalysisGuards(base, { signalKind: "essay" });
    expect(v.some((x) => x.includes("fit 85"))).toBe(true);
    expect(v.some((x) => x.includes("recommended_action=kill olmalı"))).toBe(true);
  });

  it("kovalanamaz sinyalde fit≤20 + kill temiz geçer", () => {
    const a: ArbitrageAnalysis = {
      ...base,
      fit: 15,
      confidence: "high",
      recommended_action: "kill",
    };
    expect(checkAnalysisGuards(a, { signalKind: "essay" })).toEqual([]);
  });

  it("venture/product/funding ön kapıya takılmaz", () => {
    for (const kind of ["venture", "product", "funding"] as const) {
      expect(checkAnalysisGuards(base, { signalKind: kind })).toEqual([]);
    }
  });

  it("bağlam yoksa ön kapı uygulanmaz (geriye dönük uyum)", () => {
    expect(checkAnalysisGuards(base)).toEqual([]);
  });
});
