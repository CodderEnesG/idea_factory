import { describe, it, expect } from "vitest";
import {
  enrichSignal,
  isActionableKind,
  StoredEnrichmentSchema,
  type SignalEnrichment,
} from "./enrichment.js";
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
  signal_kind: "venture",
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

describe("signal_kind ön kapısı", () => {
  it("kovalanamaz tiplerde prompt'a uyarı düşer", () => {
    for (const kind of ["essay", "research", "other"] as const) {
      const p = buildArbitrageUserPrompt(signal, {
        ...validExtraction,
        signal_kind: kind,
        fetch_ok: true,
        model: "test",
        page_chars: 100,
      });
      expect(p).toContain(`Sinyal tipi: ${kind}`);
      expect(p).toContain("kovalanabilir teşebbüs YOK");
    }
  });

  it("kovalanabilir tiplerde uyarı düşmez", () => {
    const p = buildArbitrageUserPrompt(signal, {
      ...validExtraction,
      signal_kind: "venture",
      fetch_ok: true,
      model: "test",
      page_chars: 100,
    });
    expect(p).toContain("Sinyal tipi: venture");
    expect(p).not.toContain("kovalanabilir teşebbüs YOK");
  });

  it("eski satırlarda signal_kind yoksa null'a düşer (bilinmiyor ≠ kovalanamaz), parse patlamaz", () => {
    const { signal_kind: _omit, ...legacy } = validExtraction;
    const parsed = StoredEnrichmentSchema.safeParse({
      ...legacy,
      fetch_ok: true,
      model: "test",
      page_chars: 10,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.signal_kind).toBe(null);
  });

  it("signal_kind null (legacy) prompt'ta 'bilinmiyor' olur, ön kapı uyarısı düşmez", () => {
    const p = buildArbitrageUserPrompt(signal, {
      ...validExtraction,
      signal_kind: null,
      fetch_ok: true,
      model: "test",
      page_chars: 100,
    });
    expect(p).toContain("Sinyal tipi: bilinmiyor");
    expect(p).not.toContain("kovalanabilir teşebbüs YOK");
  });
});

describe("isActionableKind", () => {
  it("teşebbüs olanları ayırır", () => {
    expect(["venture", "product", "funding"].every((k) => isActionableKind(k as never))).toBe(true);
    expect(["essay", "research", "other"].some((k) => isActionableKind(k as never))).toBe(false);
  });
});
