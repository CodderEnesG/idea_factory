import { describe, expect, it } from "vitest";
import { GATE_DEBATE_CUTOFF, isGateDebateCurrent } from "./debate-gate.js";

describe("isGateDebateCurrent", () => {
  it("kesimden önceki tartışma güncel değil", () => {
    expect(isGateDebateCurrent("2026-09-10T12:00:00Z")).toBe(false);
  });

  it("kesim anı ve sonrası güncel", () => {
    expect(isGateDebateCurrent(GATE_DEBATE_CUTOFF)).toBe(true);
    expect(isGateDebateCurrent("2026-09-15T08:00:00+03:00")).toBe(true);
  });

  it("bozuk zaman damgası güncel sayılmaz (kapıyı yanlışlıkla kapatmasın)", () => {
    expect(isGateDebateCurrent("dün")).toBe(false);
  });
});
