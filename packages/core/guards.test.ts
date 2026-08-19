import { describe, it, expect } from "vitest";
import { checkAnalysisGuards } from "./guards.js";
import { fitBand, type CustomAnalysis } from "./lenses.config.js";

const base: CustomAnalysis = {
  lens: "arbitrage",
  fit: 85,
  rationale: "kanıtlı model + net yerel wedge",
  evidence: [{ fact: "ABD'de hızlı büyüme", source: "https://example.com" }],
  extra_note: "e-fatura entegrasyonu gerekir",
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
    const watch: CustomAnalysis = {
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
    const bad: CustomAnalysis = {
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
    const bad: CustomAnalysis = {
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
    const a: CustomAnalysis = {
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

describe("checkAnalysisGuards — mercek-bağımsızlık (white_space)", () => {
  const whiteSpace: CustomAnalysis = {
    lens: "white_space",
    fit: 82,
    rationale: "yerli oyuncu yok, talep kanıtı güçlü",
    evidence: [{ fact: "TR'de doğrudan rakip bulunamadı", source: "https://example.com" }],
    extra_note: "en yakın oyuncu dolaylı, farklı segment",
    risks: ["boşluk hızla kapanabilir"],
    confidence: "high",
    validation_needed: [],
    recommended_action: "pursue",
    tags: [],
  };

  it("arbitrajla aynı kurallar white_space şekline de uygulanır (temiz geçer)", () => {
    expect(checkAnalysisGuards(whiteSpace)).toEqual([]);
  });

  it("white_space'te de bant-aksiyon çelişkisi yakalanır", () => {
    const bad = { ...whiteSpace, recommended_action: "kill" as const };
    expect(checkAnalysisGuards(bad).some((v) => v.includes("bant-aksiyon"))).toBe(true);
  });
});

describe("arbitraj tabanı guard'ı (g) — 2026-08-19, AI Yorumcusu bulgusu", () => {
  it("traction VE TR/MENA wedge'i ikisi de yoksa 80+ reddedilir", () => {
    const v = checkAnalysisGuards(base, { lensId: "arbitrage", traction: "yok", markets: ["UK", "EU"] });
    expect(v.some((x) => x.includes("arbitraj tabanı eksik"))).toBe(true);
  });

  it("traction null/boş/bilinmiyor da 'yok' sayılır", () => {
    expect(
      checkAnalysisGuards(base, { lensId: "arbitrage", traction: null, markets: [] }).some((x) =>
        x.includes("arbitraj tabanı eksik"),
      ),
    ).toBe(true);
    expect(
      checkAnalysisGuards(base, { lensId: "arbitrage", traction: "bilinmiyor", markets: [] }).some((x) =>
        x.includes("arbitraj tabanı eksik"),
      ),
    ).toBe(true);
  });

  it("yalnız traction varsa (TR wedge'i olmasa da) geçer", () => {
    const v = checkAnalysisGuards(base, { lensId: "arbitrage", traction: "500+ ücretli kullanıcı", markets: ["UK"] });
    expect(v.some((x) => x.includes("arbitraj tabanı eksik"))).toBe(false);
  });

  it("yalnız TR/MENA wedge'i varsa (traction olmasa da) geçer", () => {
    const v = checkAnalysisGuards(base, { lensId: "arbitrage", traction: "yok", markets: ["Türkiye", "MENA"] });
    expect(v.some((x) => x.includes("arbitraj tabanı eksik"))).toBe(false);
  });

  it("fit 80 altındaysa hiç devreye girmez (izle/ele bantları serbest)", () => {
    const watch = { ...base, fit: 70, recommended_action: "watch" as const, confidence: "med" as const, validation_needed: [{ data: "x", why: "y", how_to_verify: "z" }] };
    const v = checkAnalysisGuards(watch, { lensId: "arbitrage", traction: "yok", markets: [] });
    expect(v.some((x) => x.includes("arbitraj tabanı eksik"))).toBe(false);
  });

  it("başka bir mercekte (white_space, custom) hiç devreye girmez", () => {
    const v = checkAnalysisGuards(base, { lensId: "white_space", traction: "yok", markets: [] });
    expect(v.some((x) => x.includes("arbitraj tabanı eksik"))).toBe(false);
  });

  it("lensId hiç verilmezse (eski çağrı yeri) hiç devreye girmez — geriye dönük uyum", () => {
    expect(checkAnalysisGuards(base)).toEqual([]);
  });
});
