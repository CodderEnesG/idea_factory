import { describe, it, expect } from "vitest";
import type { RankedItem, Signal, BaseAnalysis } from "@idea-factory/core";
import { isQualified, weeklyQualified, noiseRatio, decisionRatio, latestDecisionPerSignal } from "./metrics";

function sig(id: string, postedAt: string): Signal {
  return {
    id,
    source: "tldr",
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "",
    market: null,
    sector: null,
    posted_at: postedAt,
    fetched_at: postedAt,
    content_hash: `h-${id}`,
  } as Signal;
}

function analysis(fit: number): BaseAnalysis {
  return {
    lens: "arbitrage",
    fit,
    rationale: "r",
    evidence: [],
    risks: [],
    confidence: "med",
    validation_needed: [],
    recommended_action: fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill",
    tags: [],
    local_competitor: "unknown",
  } as BaseAnalysis;
}

function item(id: string, postedAt: string, fit: number): RankedItem {
  return { signal: sig(id, postedAt), analyses: { arbitrage: analysis(fit) } };
}

describe("isQualified", () => {
  it("pursue ve watch nitelikli, kill değil", () => {
    expect(isQualified(item("a", "2026-08-01T00:00:00Z", 85))).toBe(true);
    expect(isQualified(item("b", "2026-08-01T00:00:00Z", 60))).toBe(true);
    expect(isQualified(item("c", "2026-08-01T00:00:00Z", 30))).toBe(false);
  });
});

describe("noiseRatio", () => {
  it("boş listede 0 döner", () => {
    expect(noiseRatio([])).toBe(0);
  });

  it("kill oranını doğru hesaplar", () => {
    const items = [item("a", "2026-08-01T00:00:00Z", 85), item("b", "2026-08-01T00:00:00Z", 20)];
    expect(noiseRatio(items)).toBe(0.5);
  });
});

describe("decisionRatio", () => {
  it("toplam sinyal 0 ise 0 döner (bölme hatası yok)", () => {
    expect(decisionRatio(0, 0)).toBe(0);
  });

  it("oranı doğru hesaplar", () => {
    expect(decisionRatio(10, 3)).toBeCloseTo(0.3);
  });
});

describe("latestDecisionPerSignal", () => {
  it("created_at DESC sıralı satırlarda ilk görülen (en yeni) kazanır", () => {
    const rows: { signal_id: string; decision: "pursue" | "watch" | "kill" }[] = [
      { signal_id: "s1", decision: "kill" }, // en yeni (dizide ilk)
      { signal_id: "s1", decision: "pursue" }, // eski — göz ardı edilmeli
      { signal_id: "s2", decision: "watch" },
    ];
    const map = latestDecisionPerSignal(rows);
    expect(map.get("s1")).toBe("kill");
    expect(map.get("s2")).toBe("watch");
    expect(map.size).toBe(2);
  });
});

describe("weeklyQualified", () => {
  it("pencere dışındaki (çok eski) sinyalleri sayaç dışı bırakır", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const items = [item("old", "2026-01-01T00:00:00Z", 90)];
    const buckets = weeklyQualified(items, 4, now);
    expect(buckets.length).toBe(4);
    expect(buckets.reduce((s, b) => s + b.total, 0)).toBe(0);
  });

  it("son haftaya düşen nitelikli/toplam sayımı doğru bantlar", () => {
    const now = new Date("2026-08-09T00:00:00Z"); // Pazar
    const items = [
      item("a", "2026-08-06T00:00:00Z", 85), // aynı hafta, nitelikli
      item("b", "2026-08-06T00:00:00Z", 60), // aynı hafta, nitelikli
      item("c", "2026-08-06T00:00:00Z", 10), // aynı hafta, nitelikli değil
    ];
    const buckets = weeklyQualified(items, 1, now);
    expect(buckets[0]!.total).toBe(3);
    expect(buckets[0]!.qualified).toBe(2);
  });

  it("posted_at parse edilemeyen sinyalleri atlar (çökme yok)", () => {
    const bad: RankedItem = { signal: sig("bad", "not-a-date"), analyses: { arbitrage: analysis(90) } };
    const buckets = weeklyQualified([bad], 2);
    expect(buckets.reduce((s, b) => s + b.total, 0)).toBe(0);
  });
});
