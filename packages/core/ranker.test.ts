import { describe, it, expect } from "vitest";
import { composite, rank, type RankedItem } from "./ranker.js";
import type { CustomAnalysis } from "./lenses.config.js";
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

function ana(fit: number): CustomAnalysis {
  const action = fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill";
  return {
    lens: "arbitrage",
    fit,
    rationale: "r",
    evidence: fit >= 80 ? [{ fact: "f", source: "s" }] : [],
    extra_note: "",
    risks: [],
    confidence: fit >= 80 ? "high" : "med",
    validation_needed: action === "pursue" ? [] : [{ data: "d", why: "w", how_to_verify: "h" }],
    recommended_action: action,
    tags: [],
    local_competitor: "unknown",
  };
}

describe("rank", () => {
  it("bant önce sıralanır (pursue > watch > kill)", () => {
    const items: RankedItem[] = [
      { signal: sig("kill", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(30) } },
      { signal: sig("watch", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(60) } },
      { signal: sig("pursue", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(90) } },
    ];
    expect(rank(items).map((r) => r.signal.id)).toEqual(["pursue", "watch", "kill"]);
  });

  it("bant içinde confidence tiebreak — yüksek güven önce, tazelikten de fit'ten de önce (problem 2)", () => {
    const items: RankedItem[] = [
      {
        signal: sig("dusuk-guven-taze", "2026-06-01T00:00:00Z"),
        analyses: { arbitrage: { ...ana(85), confidence: "low" } },
      },
      {
        signal: sig("yuksek-guven-eski", "2026-01-01T00:00:00Z"),
        analyses: { arbitrage: { ...ana(82), confidence: "high" } },
      },
    ];
    // ikisi de pursue; yüksek-güven-eski hem daha eski hem daha düşük fit ama confidence
    // önce kazanır — düşük güvenli "kovala" artık taze/yüksek-fit diye önde göstermiyor.
    expect(rank(items).map((r) => r.signal.id)).toEqual(["yuksek-guven-eski", "dusuk-guven-taze"]);
  });

  it("bant içinde tazelik tiebreak — yeni önce", () => {
    const items: RankedItem[] = [
      { signal: sig("eski", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(85) } },
      { signal: sig("yeni", "2026-06-01T00:00:00Z"), analyses: { arbitrage: ana(82) } },
    ];
    // ikisi de pursue bandı; tazelik kazanır → yeni (fit 82) eski (fit 85) önünde
    expect(rank(items).map((r) => r.signal.id)).toEqual(["yeni", "eski"]);
  });

  it("tazelik bandı geçemez — düşük-bant yeni, yüksek-bant eskiyi geçemez", () => {
    const items: RankedItem[] = [
      { signal: sig("watch-yeni", "2026-06-01T00:00:00Z"), analyses: { arbitrage: ana(70) } },
      { signal: sig("pursue-eski", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(85) } },
    ];
    expect(rank(items).map((r) => r.signal.id)).toEqual(["pursue-eski", "watch-yeni"]);
  });

  it("opts boşsa davranış birebir eskisiyle aynıdır", () => {
    const items: RankedItem[] = [
      { signal: sig("kill", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(30) } },
      { signal: sig("pursue", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(90) } },
    ];
    expect(rank(items).map((r) => r.signal.id)).toEqual(["pursue", "kill"]);
    expect(rank(items, {}).map((r) => r.signal.id)).toEqual(["pursue", "kill"]);
  });

  it("insan 'ele' derse AI 'kovala' dese bile sinyal en alta iner (geri-besleme döngüsü)", () => {
    const items: RankedItem[] = [
      { signal: sig("ai-kovala-insan-ele", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(95) } },
      { signal: sig("ai-izle", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(60) } },
    ];
    const out = rank(items, {
      bandOverride: (item) => (item.signal.id === "ai-kovala-insan-ele" ? "kill" : null),
    });
    expect(out.map((r) => r.signal.id)).toEqual(["ai-izle", "ai-kovala-insan-ele"]);
  });

  it("insan 'kovala' derse AI 'ele' dese bile sinyal en üste çıkar", () => {
    const items: RankedItem[] = [
      { signal: sig("ai-ele-insan-kovala", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(20) } },
      { signal: sig("ai-izle", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(60) } },
    ];
    const out = rank(items, {
      bandOverride: (item) => (item.signal.id === "ai-ele-insan-kovala" ? "pursue" : null),
    });
    expect(out.map((r) => r.signal.id)).toEqual(["ai-ele-insan-kovala", "ai-izle"]);
  });

  it("override null/undefined dönerse AI bandı kullanılır (karışık — kısmi override)", () => {
    const items: RankedItem[] = [
      { signal: sig("kararsiz", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(30) } },
      { signal: sig("kararli-kovala", "2026-01-01T00:00:00Z"), analyses: { arbitrage: ana(30) } },
    ];
    const out = rank(items, {
      bandOverride: (item) => (item.signal.id === "kararli-kovala" ? "pursue" : null),
    });
    expect(out.map((r) => r.signal.id)).toEqual(["kararli-kovala", "kararsiz"]);
  });

  it("lensRegistry verilirse custom mercek ağırlığı sıralamaya yansır", () => {
    // custom mercek weight=5, arbitraj weight=1 (varsayılan) — kompozit custom'a çok yakın olmalı.
    const customLens = { id: "timing", name: "Zamanlama", weight: 5, extraNoteLabel: "Not" };
    const items: RankedItem[] = [
      {
        signal: sig("agirlikli", "2026-01-01T00:00:00Z"),
        analyses: {
          arbitrage: { ...ana(30), confidence: "high" }, // düşük, ama weight=1
          timing: { ...ana(90), lens: "timing", confidence: "high" }, // yüksek, weight=5
        },
      },
    ];
    const registry = [
      { id: "arbitrage", name: "Arbitraj", weight: 1 } as never,
      customLens as never,
    ];
    const [only] = rank(items, { lensRegistry: registry });
    // ağırlıksız (registry yok): (30+90)/2=60 → watch. Ağırlıklı: (30*1+90*5)/6=80 → pursue.
    expect(composite(only!.analyses).band).toBe("watch");
    expect(composite(only!.analyses, registry).band).toBe("pursue");
  });
});

describe("composite", () => {
  it("tek mercek varken kompozit o merceğin fit/confidence'ıyla birebir aynıdır", () => {
    const a = ana(72);
    expect(composite({ arbitrage: a })).toEqual({ fit: 72, confidence: "med", band: "watch" });
  });

  it("sıfır ağırlıklı mercek kompozit skoru değiştirmez (beyaz-alan, grounding gelene kadar)", () => {
    // Artık builtin varsayılan ağırlık yok (arbitraj/beyaz-alan da admin-merceği) — gerçek
    // çağıranlar gibi (build-card-view.ts vb.) registry açıkça verilir.
    const c = composite(
      {
        arbitrage: { ...ana(90), confidence: "high" },
        white_space: { ...ana(20), lens: "white_space", confidence: "low" },
      },
      [
        { id: "arbitrage", weight: 1 } as never,
        { id: "white_space", weight: 0 } as never,
      ],
    );
    expect(c.fit).toBe(90); // beyaz-alan ağırlığı 0 → skora karışmaz (bkz. lenses.config.ts)
    expect(c.confidence).toBe("low"); // ama confidence'ta en temkinli hâlâ kazanır
  });

  it("iki mercek ağırlıklı ortalanır (açık registry ile)", () => {
    const c = composite(
      {
        arbitrage: { ...ana(90), confidence: "high" },
        white_space: { ...ana(70), lens: "white_space", confidence: "high" },
      },
      [
        { id: "arbitrage", weight: 1 } as never,
        { id: "white_space", weight: 1 } as never,
      ],
    );
    expect(c.fit).toBe(80); // (90+70)/2
    expect(c.confidence).toBe("high");
  });

  it("tüm ağırlıklar 0 ise NaN üretmez, düz ortalamaya düşer", () => {
    const c = composite(
      { white_space: { ...ana(40), lens: "white_space", confidence: "med" } },
      [{ id: "white_space", weight: 0 } as never],
    );
    expect(c.fit).toBe(40);
  });

  it("confidence en temkinlisini alır (bir mercek low derse kompozit low'dur)", () => {
    const c = composite({
      arbitrage: { ...ana(90), confidence: "high" },
      white_space: { ...ana(85), lens: "white_space", confidence: "low" },
    });
    expect(c.confidence).toBe("low");
  });
});
