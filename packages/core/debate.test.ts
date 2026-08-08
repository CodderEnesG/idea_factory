import { describe, it, expect } from "vitest";
import { runDebate, DEBATE_ROSTER } from "./debate.js";
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

const openingOut = { message: "açılış görüşüm", evidence: [{ fact: "traksiyon var", source: "producthunt" }] };
const rebuttalOut = {
  message: "itirazım",
  evidence: [{ fact: "traksiyon var", source: "producthunt" }],
  rebuts: ["Şüpheci Yatırımcı"],
  position: "watch",
};
const modOut = { synthesis: "özet", final_verdict: "watch", final_commentary: "kritik belirsizlik var" };

function scriptedProvider(outputs: unknown[]): { provider: AnalystProvider; calls: GenerateArgs[] } {
  const calls: GenerateArgs[] = [];
  let i = 0;
  return {
    calls,
    provider: {
      name: "fake",
      async generate(args) {
        calls.push(args);
        return outputs[i++] ?? outputs[outputs.length - 1];
      },
    },
  };
}

describe("runDebate", () => {
  it("sabit 7 çağrı yapar: 3 açılış + 3 itiraz + 1 sentez", async () => {
    const outputs = [
      ...DEBATE_ROSTER.map(() => openingOut),
      ...DEBATE_ROSTER.map(() => rebuttalOut),
      modOut,
    ];
    const { provider, calls } = scriptedProvider(outputs);
    const result = await runDebate(signal, { provider });

    expect(calls.length).toBe(7);
    expect(result.transcript.length).toBe(7);
    expect(result.transcript[6]!.speaker).toBe("Moderatör");
    expect(result.final_verdict).toBe("watch");
    expect(result.final_commentary).toBe("kritik belirsizlik var");
  });

  it("itiraz turunda rebuts/position eksikse guard yeniden dener", async () => {
    const badRebuttal = { message: "eksik itiraz", evidence: [{ fact: "x", source: "y" }] }; // rebuts/position yok
    const outputs = [
      ...DEBATE_ROSTER.map(() => openingOut),
      badRebuttal, // ilk rolün itirazı ihlalli
      rebuttalOut, // retry'de düzelir
      rebuttalOut,
      rebuttalOut,
      modOut,
    ];
    const { provider, calls } = scriptedProvider(outputs);
    const result = await runDebate(signal, { provider });

    // 3 açılış + (1 ihlalli + 1 retry) + 2 itiraz + 1 sentez = 8 çağrı
    expect(calls.length).toBe(8);
    expect(result.transcript[3]!.rebuts).toEqual(["Şüpheci Yatırımcı"]);
  });

  it("evidence boşsa (atıfsız) guard yeniden dener", async () => {
    const noEvidence = { message: "kanıtsız", evidence: [] };
    const outputs = [noEvidence, openingOut, ...DEBATE_ROSTER.map(() => openingOut), ...DEBATE_ROSTER.map(() => rebuttalOut), modOut];
    const { provider, calls } = scriptedProvider(outputs);
    await runDebate(signal, { provider });
    expect(calls.length).toBeGreaterThan(7); // en az bir retry tetiklendi
  });
});
