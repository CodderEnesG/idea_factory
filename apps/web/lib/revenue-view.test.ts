import { describe, it, expect } from "vitest";
import { isRevenueSource, revenueMetricLine, sortByRevenue, type RevenueMeta } from "./revenue-view";

describe("isRevenueSource", () => {
  it("gelir kaynaklarını tanır, diğerlerini tanımaz", () => {
    expect(isRevenueSource("manual_revenue")).toBe(true);
    expect(isRevenueSource("appstore_grossing")).toBe(true);
    expect(isRevenueSource("techcrunch_apps")).toBe(false);
    expect(isRevenueSource("tldr:founders")).toBe(false);
  });
});

describe("revenueMetricLine", () => {
  it("30 günlük geliri ve büyümeyi kısaltır", () => {
    expect(revenueMetricLine({ revenue_30d_usd: 85881, growth_30d_pct: 12 })).toBe("30g $85.9K ↑12%");
    expect(revenueMetricLine({ revenue_30d_usd: 83360, growth_30d_pct: -79 })).toBe("30g $83.4K ↓79%");
  });

  it("rakam yoksa sıralamayı, App Store'da hasılat sırasını gösterir", () => {
    expect(revenueMetricLine({ rank: 4 })).toBe("gelir #4");
    expect(revenueMetricLine({ us_rank: 37 })).toBe("ABD hasılat #37");
    expect(revenueMetricLine({ us_rank: 3, chart: "Health & Fitness" })).toBe("ABD Health & Fitness #3");
  });

  it("meta yoksa null", () => {
    expect(revenueMetricLine(undefined)).toBeNull();
    expect(revenueMetricLine({})).toBeNull();
  });
});

describe("sortByRevenue", () => {
  it("sıra küçük olan önce, sırasızlar gelire göre, metasızlar sonda", () => {
    const meta = new Map<string, RevenueMeta>([
      ["b", { rank: 27, revenue_30d_usd: 85881 }],
      ["a", { rank: 1 }],
      ["c", { revenue_30d_usd: 1000 }],
      ["d", { revenue_30d_usd: 5000 }],
    ]);
    const rows = ["x", "c", "b", "d", "a"].map((id) => ({ id }));
    expect(sortByRevenue(rows, meta).map((r) => r.id)).toEqual(["a", "b", "d", "c", "x"]);
  });
});
