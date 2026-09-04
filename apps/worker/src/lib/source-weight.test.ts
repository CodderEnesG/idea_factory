import { describe, it, expect } from "vitest";
import { computeSourceWeights } from "./source-weight.js";

function rows(source: string, fits: number[]): { source: string; bestFit: number }[] {
  return fits.map((bestFit) => ({ source, bestFit }));
}

describe("computeSourceWeights", () => {
  it("yüksek fit≥80 oranlı kaynağa ortalamanın üstü ağırlık verir", () => {
    const data = [
      ...rows("iyi", [90, 90, 90, 20, 20]), // %60 fit80
      ...rows("kotu", [20, 20, 20, 20, 20]), // %0 fit80
    ];
    const w = computeSourceWeights(data);
    expect(w.get("iyi")!).toBeGreaterThan(1);
    expect(w.get("kotu")!).toBeLessThan(1);
  });

  it("hiç fit≥80 üretmeyen ama büyük örneklemli kaynağı elemez, yalnız düşürür", () => {
    const data = [
      ...Array.from({ length: 100 }, () => ({ source: "sifir", bestFit: 20 })),
      ...rows("baseline", [90, 20, 20, 20, 20]), // global oranı sıfırdan çıkarır
    ];
    const w = computeSourceWeights(data);
    expect(w.get("sifir")!).toBeGreaterThan(0);
    expect(w.get("sifir")!).toBeLessThan(1);
  });

  it("küçük örneklem global ortalamaya doğru çekilir (Bayes düzeltmesi)", () => {
    const data = [
      ...rows("kucuk-sanssiz", [20]), // n=1, %0 ama tek örnek
      ...rows("buyuk-sanssiz", Array(50).fill(20)), // n=50, %0
      ...rows("baseline", [90, 90, 20, 20, 20]), // global oranı sıfırdan çıkarır
    ];
    const w = computeSourceWeights(data);
    // küçük örneklemli kaynağın ağırlığı, aynı oranlı ama büyük örneklemliye göre 1'e daha yakın olmalı
    expect(Math.abs(w.get("kucuk-sanssiz")! - 1)).toBeLessThan(Math.abs(w.get("buyuk-sanssiz")! - 1));
  });

  it("ağırlıklar [0.4, 2.5] aralığında kalır", () => {
    const data = [...rows("hep-yuksek", Array(50).fill(95)), ...rows("hep-dusuk", Array(50).fill(10))];
    const w = computeSourceWeights(data);
    for (const v of w.values()) {
      expect(v).toBeGreaterThanOrEqual(0.4);
      expect(v).toBeLessThanOrEqual(2.5);
    }
  });

  it("boş girdi için boş map döner", () => {
    expect(computeSourceWeights([]).size).toBe(0);
  });
});
