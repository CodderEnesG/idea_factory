import { describe, it, expect } from "vitest";
import { selectGateCandidates, selectAutoDebateCandidates, type DecisionLogRow } from "./debate-auto-select.js";

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

describe("selectGateCandidates — Yorumcu kapısı", () => {
  const row = (id: string, band: "pursue" | "watch" | "kill", fit: number, ts: string) => ({
    signal_id: id,
    band,
    fit,
    ts,
  });

  it("yalnız kompozit bandı 'pursue' olanları seçer", () => {
    const rows = [
      row("a", "pursue", 88, "2026-08-20T00:00:00Z"),
      row("b", "watch", 65, "2026-08-21T00:00:00Z"),
      row("c", "kill", 20, "2026-08-22T00:00:00Z"),
    ];
    expect(selectGateCandidates(rows, new Map())).toEqual(["a"]);
  });

  it("2 otomatik turu tamamlananlar düşer, 1 turu olan hâlâ aday", () => {
    const rows = [
      row("done", "pursue", 88, "2026-08-20T00:00:00Z"),
      row("half", "pursue", 85, "2026-08-21T00:00:00Z"),
      row("none", "pursue", 90, "2026-08-22T00:00:00Z"),
    ];
    const counts = new Map([
      ["done", 2],
      ["half", 1],
    ]);
    expect(selectGateCandidates(rows, counts).sort()).toEqual(["half", "none"]);
  });

  it("3 turu olan da düşer (mükerrer kayıtlar kapıyı yeniden açmaz)", () => {
    const rows = [row("x", "pursue", 88, "2026-08-20T00:00:00Z")];
    expect(selectGateCandidates(rows, new Map([["x", 3]]))).toEqual([]);
  });

  it("en yeni analiz önce, eşitlikte yüksek fit önce", () => {
    const rows = [
      row("old", "pursue", 95, "2026-08-01T00:00:00Z"),
      row("newLow", "pursue", 82, "2026-08-25T00:00:00Z"),
      row("newHigh", "pursue", 90, "2026-08-25T00:00:00Z"),
    ];
    expect(selectGateCandidates(rows, new Map())).toEqual(["newHigh", "newLow", "old"]);
  });

  it("boş girdi boş çıktı", () => {
    expect(selectGateCandidates([], new Map())).toEqual([]);
  });
});

describe("selectGateCandidates — tamamlanmaya en yakın önce", () => {
  const row = (id: string, fit: number, ts: string) => ({
    signal_id: id,
    band: "pursue" as const,
    fit,
    ts,
  });

  it("1 turu eksik olan, hiç turu olmayandan önce gelir (tazelik/fit'e rağmen)", () => {
    const rows = [
      row("freshEmpty", 95, "2026-08-26T00:00:00Z"), // taze + yüksek fit ama 0 tur
      row("staleHalf", 81, "2026-01-01T00:00:00Z"), // eski + düşük fit ama 1 tur var
    ];
    const counts = new Map([["staleHalf", 1]]);
    // Yarım kapı hiçbir işe yaramıyor: sinyal "Yorumcu bekliyor"da asılı kalır.
    expect(selectGateCandidates(rows, counts)).toEqual(["staleHalf", "freshEmpty"]);
  });

  it("eşit eksik tur sayısında eski sıralama korunur (yeni önce, fit tiebreak)", () => {
    const rows = [
      row("old", 95, "2026-08-01T00:00:00Z"),
      row("newLow", 82, "2026-08-25T00:00:00Z"),
      row("newHigh", 90, "2026-08-25T00:00:00Z"),
    ];
    expect(selectGateCandidates(rows, new Map())).toEqual(["newHigh", "newLow", "old"]);
  });
});
