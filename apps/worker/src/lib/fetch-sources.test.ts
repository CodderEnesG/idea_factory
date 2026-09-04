import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAllSources } from "./fetch-sources.js";
import type { Source } from "../sources/types.js";
import type { Signal } from "@idea-factory/core";

/**
 * FAZ6_PLAN.md §Faz 1.3 — toplu başarısızlık guard'ının girdisi.
 *
 * Eskiden `fetchAll` yalnız satırları döndürüyordu; tüm 16 kaynak patlasa bile `collected`
 * boş kalıp ingest "yeni sinyal yok (idempotent)" yazarak **exit 0** ediyordu, yani cron
 * YEŞİL görünüyordu. Diğer beş aşamanın (enrich/triage/analyze/debate-auto/backfill)
 * hepsinde bu guard vardı, yalnız ingest'te yoktu.
 */
function signal(id: string): Signal {
  return {
    id,
    source: "test",
    type: "launch",
    title: id,
    url: `https://x/${id}`,
    summary_raw: "",
    market: null,
    sector: null,
    posted_at: null,
    fetched_at: "2026-08-26T00:00:00.000Z",
    content_hash: id,
  };
}

const ok = (name: string, rows: Signal[]): Source => ({ name, fetch: async () => rows });
const boom = (name: string): Source => ({
  name,
  fetch: async () => {
    throw new Error("feed 404");
  },
});

const settings = { per_source_limit: 0, concurrency: 2 };

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("fetchAllSources", () => {
  it("hepsi patlarsa okSources 0 — guard'ın tetikleneceği durum", async () => {
    const r = await fetchAllSources([boom("a"), boom("b")], settings);
    expect(r.okSources).toBe(0);
    expect(r.failedSources.sort()).toEqual(["a", "b"]);
    expect(r.signals).toEqual([]);
  });

  it("SAĞLIKLI ama BOŞ feed başarısızlık DEĞİLDİR — okSources sayar", async () => {
    // Kritik ayrım: "bugün haber yok" ile "feed bozuldu" aynı şey değil. Yalnız fırlatan
    // kaynak sayılmasaydı sessiz bir günde guard yanlış alarm verirdi.
    const r = await fetchAllSources([ok("bos", []), ok("dolu", [signal("s1")])], settings);
    expect(r.okSources).toBe(2);
    expect(r.failedSources).toEqual([]);
    expect(r.signals).toHaveLength(1);
  });

  it("kısmi hata: çalışanlar toplanır, patlayan isimleriyle raporlanır", async () => {
    const r = await fetchAllSources([ok("iyi", [signal("s1")]), boom("kotu")], settings);
    expect(r.okSources).toBe(1);
    expect(r.failedSources).toEqual(["kotu"]);
    expect(r.signals.map((s) => s.id)).toEqual(["s1"]);
  });

  it("bir kaynağın patlaması diğerlerini düşürmez", async () => {
    const r = await fetchAllSources(
      [boom("a"), ok("b", [signal("s1")]), boom("c"), ok("d", [signal("s2")])],
      settings,
    );
    expect(r.okSources).toBe(2);
    expect(r.signals.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
  });

  it("per_source_limit uygulanır", async () => {
    const r = await fetchAllSources([ok("a", [signal("s1"), signal("s2"), signal("s3")])], {
      per_source_limit: 2,
      concurrency: 1,
    });
    expect(r.signals).toHaveLength(2);
  });

  it("boş kaynak listesi: okSources 0 ama guard `sources.length > 0` şartıyla korunuyor", async () => {
    const r = await fetchAllSources([], settings);
    expect(r).toEqual({ signals: [], okSources: 0, failedSources: [] });
  });
});
