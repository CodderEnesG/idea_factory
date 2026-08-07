import { describe, it, expect } from "vitest";
import { triageSignal, buildTriageUserPrompt } from "./triage.js";
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

function fakeProvider(capture: GenerateArgs[], result: unknown): AnalystProvider {
  return {
    name: "fake",
    async generate(args: GenerateArgs) {
      capture.push(args);
      return result;
    },
  };
}

describe("triageSignal", () => {
  it("geçerli çıktıda score/reason döner", async () => {
    const calls: GenerateArgs[] = [];
    const out = await triageSignal(signal, null, {
      provider: fakeProvider(calls, { score: 72, reason: "kanıtlı model, ilgili sektör" }),
    });
    expect(out.score).toBe(72);
    expect(calls[0]!.user).toContain("Acme Stok AI");
    expect(calls[0]!.user).toContain("ön-ele");
  });

  it("şema-bozuk çıktıda feedback'le yeniden dener", async () => {
    const calls: GenerateArgs[] = [];
    let n = 0;
    const provider: AnalystProvider = {
      name: "fake",
      async generate(args) {
        calls.push(args);
        n++;
        return n === 1 ? { bozuk: true } : { score: 40, reason: "belirsiz" };
      },
    };
    const out = await triageSignal(signal, null, { provider });
    expect(out.score).toBe(40);
    expect(calls.length).toBe(2);
    expect(calls[1]!.user).toContain("şema hatası");
  });

  it("score aralık dışıysa (>100) reddedilip retry tükenince hata fırlatır", async () => {
    const calls: GenerateArgs[] = [];
    const provider = fakeProvider(calls, { score: 150, reason: "x" });
    await expect(triageSignal(signal, null, { provider, maxRetries: 0 })).rejects.toThrow(
      /geçerli çıktı üretemedi/,
    );
  });

  it("buildTriageUserPrompt sinyal ve zenginleştirme bloğunu içerir", () => {
    const p = buildTriageUserPrompt(signal, {
      signal_kind: "venture",
      project_summary: "AI ile stok tahmini yapan B2B SaaS.",
      hq_country: "US",
      markets: ["US"],
      funding: { stage: null, amount: null, total_raised: null, investors: [] },
      target_users: null,
      traction: null,
      capital_intensity: "low",
      regulation_flags: [],
      wtp_signals: null,
      sector: "vertical SaaS",
      market: "US",
      fetch_ok: true,
      model: "test",
      page_chars: 100,
      triage_score: null,
      triage_reason: null,
    });
    expect(p).toContain("Acme Stok AI");
    expect(p).toContain("Zenginleştirme");
    expect(p).toContain("ön-ele");
  });
});
