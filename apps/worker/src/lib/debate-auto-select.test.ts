import { describe, it, expect } from "vitest";
import { selectAutoDebateCandidates, type DecisionLogRow } from "./debate-auto-select.js";

// created_at desc (en yeni önce) — dedupe kuralı bu sıralamaya dayanır.
function row(signalId: string, decision: string, decidedBy: string | null, createdAt: string): DecisionLogRow {
  return { signal_id: signalId, decision, decided_by: decidedBy, created_at: createdAt };
}

describe("selectAutoDebateCandidates", () => {
  it("en son kararı pursue olan sinyali seçer", () => {
    const decisions = [row("s1", "pursue", "enes", "2026-08-21T10:00:00Z")];
    expect(selectAutoDebateCandidates(decisions, new Set())).toEqual(["s1"]);
  });

  it("en son karar pursue DEĞİLSE (daha yeni kill/watch üzerine yazmış) seçmez", () => {
    const decisions = [
      row("s1", "kill", "enes", "2026-08-21T12:00:00Z"), // en yeni
      row("s1", "pursue", "enes", "2026-08-21T10:00:00Z"), // eski
    ];
    expect(selectAutoDebateCandidates(decisions, new Set())).toEqual([]);
  });

  it("zaten debate yazılmış sinyali tekrar seçmez (idempotent)", () => {
    const decisions = [row("s1", "pursue", "enes", "2026-08-21T10:00:00Z")];
    expect(selectAutoDebateCandidates(decisions, new Set(["s1"]))).toEqual([]);
  });

  it("bir kullanıcının pursue'u diğerinin kill'i olsa da yeterlidir", () => {
    const decisions = [
      row("s1", "kill", "ayse", "2026-08-21T11:00:00Z"),
      row("s1", "pursue", "enes", "2026-08-21T10:00:00Z"),
    ];
    expect(selectAutoDebateCandidates(decisions, new Set())).toEqual(["s1"]);
  });

  it("en yeni pursue kararı olan sinyal önce gelir", () => {
    const decisions = [
      row("s2", "pursue", "enes", "2026-08-21T09:00:00Z"),
      row("s1", "pursue", "enes", "2026-08-21T10:00:00Z"),
    ];
    expect(selectAutoDebateCandidates(decisions, new Set())).toEqual(["s1", "s2"]);
  });

  it("hiç karar yoksa boş döner", () => {
    expect(selectAutoDebateCandidates([], new Set())).toEqual([]);
  });
});
