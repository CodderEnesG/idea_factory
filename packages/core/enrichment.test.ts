import { describe, it, expect } from "vitest";
import { enrichSignal, type SignalEnrichment } from "./enrichment.js";
import { buildArbitrageUserPrompt } from "./lenses.config.js";
import type { AnalystProvider, GenerateArgs } from "./providers/types.js";
import type { Signal } from "./signal.js";

const signal: Signal = {
  id: "abc123",
  source: "producthunt",
  type: "launch",
  title: "Acme Stok AI",
  url: "https://example.com/acme",
  summary_raw: "Restoranlar için AI stok tahmini.",
  market: null,
  sector: null,
  posted_at: null,
  fetched_at: "2026-07-18T00:00:00.000Z",
  content_hash: "h1",
};

const validExtraction: SignalEnrichment = {
  project_summary: "Restoranlar için AI ile stok ve israf yönetimi yapan B2B SaaS.",
  hq_country: "US",
  markets: ["US"],
  funding: { stage: "seed", amount: "$2M", total_raised: null, investors: ["Foo VC"] },
  target_users: "KOBİ",
  traction: null,
  capital_intensity: "low",
  regulation_flags: [],
  wtp_signals: "aylık abonelik",
  sector: "vertical SaaS",
  market: "US",
};

function fakeProvider(capture: GenerateArgs[]): AnalystProvider {
  return {
    name: "fake",
    async generate(args: GenerateArgs) {
      capture.push(args);
      return validExtraction;
    },
  };
}

describe("enrichSignal", () => {
  it("sayfa metnini kırpılmış olarak prompt'a koyar", async () => {
    const calls: GenerateArgs[] = [];
    const out = await enrichSignal(signal, "SAYFA METNİ BURADA", { provider: fakeProvider(calls) });
    expect(out.hq_country).toBe("US");
    expect(calls[0]!.user).toContain("SAYFA METNİ BURADA");
    expect(calls[0]!.user).toContain("Acme Stok AI");
  });

  it("pageText null iken 'sayfa çekilemedi' moduna düşer", async () => {
    const calls: GenerateArgs[] = [];
    await enrichSignal(signal, null, { provider: fakeProvider(calls) });
    expect(calls[0]!.user).toContain("Sayfa çekilemedi");
  });

  it("şema-bozuk çıktıda feedback'le yeniden dener", async () => {
    const calls: GenerateArgs[] = [];
    let n = 0;
    const provider: AnalystProvider = {
      name: "fake",
      async generate(args) {
        calls.push(args);
        n++;
        return n === 1 ? { bozuk: true } : validExtraction;
      },
    };
    const out = await enrichSignal(signal, null, { provider });
    expect(out.project_summary).toContain("B2B SaaS");
    expect(calls.length).toBe(2);
    expect(calls[1]!.user).toContain("şema hatası");
  });
});

describe("buildArbitrageUserPrompt + enrichment", () => {
  it("zenginleştirme bloğunu ekler, fetch_ok=false uyarısıyla", () => {
    const p = buildArbitrageUserPrompt(signal, {
      ...validExtraction,
      fetch_ok: false,
      model: "test",
      page_chars: null,
    });
    expect(p).toContain("Zenginleştirme");
    expect(p).toContain("US");
    expect(p).toContain("sayfa çekilemedi");
  });

  it("enrichment yokken bugünkü prompt'la aynı kalır", () => {
    const p = buildArbitrageUserPrompt(signal);
    expect(p).not.toContain("Zenginleştirme");
  });
});
