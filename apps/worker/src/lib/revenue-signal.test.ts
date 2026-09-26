import { describe, it, expect } from "vitest";
import { shortHash } from "@idea-factory/core";
import { MANUAL_REVENUE_SOURCE, revenueRecordToSignal, revenueSummary } from "./revenue-signal.js";

const AT = "2026-09-27T10:00:00.000Z";
const boothie = {
  name: "Boothie",
  website: "https://boothie.app",
  description: "AI photo editor app.",
  rank: 70,
  revenue_30d_usd: 39688,
  growth_30d_pct: -2,
  category: "AI photo app",
  audience: "b2c" as const,
  mobile: true,
};

describe("revenueSummary", () => {
  it("geliri, büyümeyi, kitleyi ve açıklamayı tek satırda verir", () => {
    expect(revenueSummary(boothie)).toBe(
      "Ödeme sağlayıcısıyla doğrulanmış gelir: son 30 gün $39,688, gelir sıralaması #70 · " +
        "30 günlük büyüme %-2 · tüketiciye (B2C) · mobil uygulama · AI photo app · AI photo editor app.",
    );
  });

  it("rakam yoksa yalnız sıralamayı yazar", () => {
    const s = revenueSummary({ name: "Stan", website: "https://stan.store", description: "Creator store.", rank: 1 });
    expect(s).toBe("Ödeme sağlayıcısıyla doğrulanmış gelir: gelir sıralaması #1 · Creator store.");
  });
});

describe("revenueRecordToSignal", () => {
  it("manual_revenue sinyali üretir, id url'den, metrik source_meta'da", () => {
    const s = revenueRecordToSignal(boothie, AT);
    expect(s.source).toBe(MANUAL_REVENUE_SOURCE);
    expect(s.type).toBe("company");
    expect(s.id).toBe(shortHash("https://boothie.app"));
    expect(s.fetched_at).toBe(AT);
    expect(s.source_meta).toMatchObject({ kind: MANUAL_REVENUE_SOURCE, rank: 70, revenue_30d_usd: 39688, mobile: true });
  });

  it("aynı kayıt aynı sinyali verir (idempotent ekleme)", () => {
    expect(revenueRecordToSignal(boothie, AT)).toEqual(revenueRecordToSignal(boothie, AT));
  });
});
