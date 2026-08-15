import { describe, it, expect } from "vitest";
import { analyzeSignal } from "./analyst.js";
import { WHITE_SPACE_SEED_LENS, buildCustomLens, type CustomAnalysis } from "./lenses.config.js";
import type { AnalystProvider } from "./providers/types.js";
import type { Signal } from "./signal.js";

const whiteSpaceLens = buildCustomLens(WHITE_SPACE_SEED_LENS);
type WhiteSpaceAnalysis = CustomAnalysis;

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

/** Guard'lardan geçen geçerli bir beyaz-alan analizi (lens alanı hariç). */
function validBody(): Omit<WhiteSpaceAnalysis, "lens"> {
  return {
    fit: 60,
    rationale: "TR'de iki erken oyuncu var, talep kanıtı zayıf.",
    evidence: [{ fact: "TR'de 2 benzer girişim", source: "producthunt sayfası" }],
    risks: ["talep kanıtı yok"],
    confidence: "med",
    validation_needed: [
      { data: "TR restoran sayısı", why: "pazar büyüklüğü kararı değiştirir", how_to_verify: "TÜİK" },
    ],
    recommended_action: "watch",
    tags: ["saas"],
    extra_note: "iki erken oyuncu, hakim oyuncu yok",
  };
}

function provider(outputs: unknown[]): AnalystProvider & { calls: number } {
  let i = 0;
  return {
    name: "fake",
    calls: 0,
    async generate() {
      this.calls++;
      return outputs[Math.min(i++, outputs.length - 1)];
    },
  };
}

describe("analyzeSignal — lens id normalizasyonu", () => {
  it("modelin yanlış yazdığı lens id'sini düzeltir (white-space → white_space)", async () => {
    // Gemini üretimde tam bunu yapıyordu: tire ile yazıp zod literal'ını düşürüyor, sinyal
    // 4 denemede de yazılamıyordu (2026-08-10 backfill teşhisi).
    const p = provider([{ ...validBody(), lens: "white-space" }]);
    const out = await analyzeSignal(signal, whiteSpaceLens, { provider: p });
    expect(out.lens).toBe("white_space");
    expect(p.calls).toBe(1); // tek denemede geçti — yeniden deneme yakılmadı
  });

  it("lens alanı hiç yoksa da doldurur", async () => {
    const p = provider([validBody()]);
    const out = await analyzeSignal(signal, whiteSpaceLens, { provider: p });
    expect(out.lens).toBe("white_space");
  });

  it("gerçek şema hatası hâlâ yeniden denemeyi tetikler ve son ihlali hataya taşır", async () => {
    const p = provider([{ ...validBody(), fit: 999, lens: "white-space" }]);
    await expect(analyzeSignal(signal, whiteSpaceLens, { provider: p, maxRetries: 1 })).rejects.toThrow(
      /son ihlal/,
    );
    expect(p.calls).toBe(2);
  });
});
