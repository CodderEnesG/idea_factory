import { describe, it, expect } from "vitest";
import type { RankedItem, Signal, BaseAnalysis } from "@idea-factory/core";
import {
  isQualified,
  weeklyQualified,
  noiseRatio,
  decisionRatio,
  latestDecisionPerSignal,
  pursuePrecision,
  debateVerdictMix,
  groundingCoverage,
} from "./metrics";

function sig(id: string, postedAt: string): Signal {
  return {
    id,
    source: "tldr",
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "",
    market: null,
    sector: null,
    posted_at: postedAt,
    fetched_at: postedAt,
    content_hash: `h-${id}`,
  } as Signal;
}

function analysis(fit: number): BaseAnalysis {
  return {
    lens: "arbitrage",
    fit,
    rationale: "r",
    evidence: [],
    risks: [],
    confidence: "med",
    validation_needed: [],
    recommended_action: fit >= 80 ? "pursue" : fit >= 50 ? "watch" : "kill",
    tags: [],
    local_competitor: "unknown",
  } as BaseAnalysis;
}

function item(id: string, postedAt: string, fit: number): RankedItem {
  return { signal: sig(id, postedAt), analyses: { arbitrage: analysis(fit) } };
}

describe("isQualified", () => {
  it("pursue ve watch nitelikli, kill değil", () => {
    expect(isQualified(item("a", "2026-08-01T00:00:00Z", 85))).toBe(true);
    expect(isQualified(item("b", "2026-08-01T00:00:00Z", 60))).toBe(true);
    expect(isQualified(item("c", "2026-08-01T00:00:00Z", 30))).toBe(false);
  });
});

describe("noiseRatio", () => {
  it("boş listede 0 döner", () => {
    expect(noiseRatio([])).toBe(0);
  });

  it("kill oranını doğru hesaplar", () => {
    const items = [item("a", "2026-08-01T00:00:00Z", 85), item("b", "2026-08-01T00:00:00Z", 20)];
    expect(noiseRatio(items)).toBe(0.5);
  });
});

describe("decisionRatio", () => {
  it("toplam sinyal 0 ise 0 döner (bölme hatası yok)", () => {
    expect(decisionRatio(0, 0)).toBe(0);
  });

  it("oranı doğru hesaplar", () => {
    expect(decisionRatio(10, 3)).toBeCloseTo(0.3);
  });
});

describe("latestDecisionPerSignal", () => {
  it("created_at DESC sıralı satırlarda ilk görülen (en yeni) kazanır", () => {
    const rows: { signal_id: string; decision: "pursue" | "watch" | "kill" }[] = [
      { signal_id: "s1", decision: "kill" }, // en yeni (dizide ilk)
      { signal_id: "s1", decision: "pursue" }, // eski — göz ardı edilmeli
      { signal_id: "s2", decision: "watch" },
    ];
    const map = latestDecisionPerSignal(rows);
    expect(map.get("s1")).toBe("kill");
    expect(map.get("s2")).toBe("watch");
    expect(map.size).toBe(2);
  });
});

describe("weeklyQualified", () => {
  it("pencere dışındaki (çok eski) sinyalleri sayaç dışı bırakır", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const items = [item("old", "2026-01-01T00:00:00Z", 90)];
    const buckets = weeklyQualified(items, 4, now);
    expect(buckets.length).toBe(4);
    expect(buckets.reduce((s, b) => s + b.total, 0)).toBe(0);
  });

  it("son haftaya düşen nitelikli/toplam sayımı doğru bantlar", () => {
    const now = new Date("2026-08-09T00:00:00Z"); // Pazar
    const items = [
      item("a", "2026-08-06T00:00:00Z", 85), // aynı hafta, nitelikli
      item("b", "2026-08-06T00:00:00Z", 60), // aynı hafta, nitelikli
      item("c", "2026-08-06T00:00:00Z", 10), // aynı hafta, nitelikli değil
    ];
    const buckets = weeklyQualified(items, 1, now);
    expect(buckets[0]!.total).toBe(3);
    expect(buckets[0]!.qualified).toBe(2);
  });

  it("posted_at parse edilemeyen sinyalleri atlar (çökme yok)", () => {
    const bad: RankedItem = { signal: sig("bad", "not-a-date"), analyses: { arbitrage: analysis(90) } };
    const buckets = weeklyQualified([bad], 2);
    expect(buckets.reduce((s, b) => s + b.total, 0)).toBe(0);
  });
});

describe("pursuePrecision — kapı gerçekten iş yapıyor mu (FAZ6 §Faz 5.5)", () => {
  const row = (
    signalId: string,
    gatedBand: "pursue" | "watch" | "kill",
    gate: "confirmed" | "caveat" | "pending" | "vetoed" | "n/a",
    competition: string | null = null,
  ) => ({ signalId, gatedBand, gate, competition });

  it("yalnız kapılı bandı kovala OLAN ve insan kararı OLAN sinyaller sayılır", () => {
    const rows = [
      row("a", "pursue", "confirmed"),
      row("b", "pursue", "caveat"),
      row("c", "watch", "pending"), // kovala değil
      row("d", "pursue", "confirmed"), // insan bakmamış
    ];
    const decisions = new Map<string, "pursue" | "watch" | "kill">([
      ["a", "pursue"],
      ["b", "kill"],
      ["c", "pursue"],
    ]);
    const r = pursuePrecision(rows, decisions);
    expect(r.overall.reviewed).toBe(2);
    expect(r.overall.agreed).toBe(1);
    expect(r.overall.precision).toBe(0.5);
  });

  it("kapı kırılımı: onaylı vs çekinceli ayrı ayrı ölçülür", () => {
    const rows = [
      row("a", "pursue", "confirmed"),
      row("b", "pursue", "confirmed"),
      row("c", "pursue", "caveat"),
    ];
    const decisions = new Map<string, "pursue" | "watch" | "kill">([
      ["a", "pursue"],
      ["b", "pursue"],
      ["c", "kill"],
    ]);
    const r = pursuePrecision(rows, decisions);
    expect(r.byGate.confirmed.precision).toBe(1);
    expect(r.byGate.caveat.precision).toBe(0);
  });

  it("rekabet kovası kırılımı; beyaz-alan analizi olmayanlar 'yok' kovasında", () => {
    const rows = [row("a", "pursue", "confirmed", "boş"), row("b", "pursue", "confirmed", null)];
    const decisions = new Map<string, "pursue" | "watch" | "kill">([
      ["a", "pursue"],
      ["b", "kill"],
    ]);
    const r = pursuePrecision(rows, decisions);
    expect(r.byCompetition["boş"]!.precision).toBe(1);
    expect(r.byCompetition["yok"]!.precision).toBe(0);
  });

  it("hiç incelenmemişse precision null — 0 ile karıştırılmamalı", () => {
    const r = pursuePrecision([row("a", "pursue", "confirmed")], new Map());
    expect(r.overall.precision).toBeNull();
    expect(r.overall.reviewed).toBe(0);
  });
});

describe("debateVerdictMix", () => {
  it("kovala/izle/ele sayar", () => {
    expect(debateVerdictMix(["kill", "kill", "watch", "pursue"])).toEqual({
      pursue: 1,
      watch: 1,
      kill: 2,
    });
  });

  it("boş girdi hepsi sıfır", () => {
    expect(debateVerdictMix([])).toEqual({ pursue: 0, watch: 0, kill: 0 });
  });
});

describe("groundingCoverage — Faz 4'ün TEK ölçütü (taban %66)", () => {
  it("yalnız hedef merceğin satırlarını sayar", () => {
    const rows = [
      { lens: "white_space", confidence: "low" },
      { lens: "white_space", confidence: "high" },
      { lens: "arbitrage", confidence: "low" }, // sayılmamalı
    ];
    const r = groundingCoverage(rows);
    expect(r.total).toBe(2);
    expect(r.low).toBe(1);
    expect(r.lowRatio).toBe(0.5);
  });

  it("hiç satır yoksa oran null", () => {
    expect(groundingCoverage([]).lowRatio).toBeNull();
  });
});
