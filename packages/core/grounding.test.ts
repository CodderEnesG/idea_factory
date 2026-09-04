import { describe, it, expect, afterEach } from "vitest";
import { buildGroundingQueries, categoryPhrase, shouldGround } from "./grounding.js";
import type { Signal } from "./signal.js";
import type { StoredEnrichment } from "./enrichment.js";

afterEach(() => {
  delete process.env["GROUNDING_ENABLED"];
});

const signal: Signal = {
  id: "abc123",
  source: "producthunt",
  type: "launch",
  title: "Skippr AI",
  url: "https://example.com/skippr",
  summary_raw: "raw",
  market: null,
  sector: "B2B SaaS",
  posted_at: null,
  fetched_at: "2026-07-18T00:00:00.000Z",
  content_hash: "h1",
};

describe("shouldGround — mercek özelliği + global anahtar", () => {
  it("global anahtar kapalıysa mercek istese de arama yok", () => {
    expect(shouldGround({ grounding: true })).toBe(false);
  });

  it("global açık + mercek istiyor → arama var", () => {
    process.env["GROUNDING_ENABLED"] = "true";
    expect(shouldGround({ grounding: true })).toBe(true);
  });

  it("global açık ama mercek istemiyor → arama yok (arbitraj bu durumda)", () => {
    process.env["GROUNDING_ENABLED"] = "true";
    expect(shouldGround({ grounding: false })).toBe(false);
  });
});

describe("categoryPhrase — marka adı değil kategori", () => {
  it("enrichment özeti varsa onu kullanır (başlık marka adıdır)", () => {
    const enr = { project_summary: "Restoranlar için AI stok tahmini" } as StoredEnrichment;
    const phrase = categoryPhrase(signal, enr);
    expect(phrase).toContain("Restoranlar için AI stok tahmini");
    expect(phrase).toContain("B2B SaaS");
  });

  it("enrichment yoksa sektöre düşer", () => {
    expect(categoryPhrase(signal, null)).toBe("B2B SaaS");
  });

  it("ne özet ne sektör varsa son çare başlıktır", () => {
    expect(categoryPhrase({ ...signal, sector: null }, null)).toBe("Skippr AI");
  });
});

describe("buildGroundingQueries — üç hedefli sorgu", () => {
  const queries = buildGroundingQueries(signal, "Restoranlar için AI stok tahmini — B2B SaaS");

  it("üç sorgu üretir: TR, TR/MENA-İngilizce, momentum", () => {
    expect(queries).toHaveLength(3);
    expect(queries[0]).toContain("Türkiye");
    expect(queries[1]).toContain("MENA");
    expect(queries[2]).toMatch(/momentum|yatırım turu/i);
  });

  it("her sorgu kategoriyi taşır, marka adına saplanmaz", () => {
    for (const q of queries) expect(q).toContain("Restoranlar için AI stok tahmini");
  });

  it("her sorgu kaynak URL'si ve açık BULUNAMADI şartı dayatır (guard (c) atıf istiyor)", () => {
    for (const q of queries) {
      expect(q).toContain("url");
      expect(q).toContain("BULUNAMADI");
    }
  });
});
