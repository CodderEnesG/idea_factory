import { describe, it, expect } from "vitest";
import { computeSourceHealth, canonicalSourceName, KNOWN_SOURCES } from "./source-health";

const NOW = new Date("2026-08-09T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

describe("canonicalSourceName", () => {
  it("tldr alt-kategorilerini 'tldr' altında toplar", () => {
    expect(canonicalSourceName("tldr:founders")).toBe("tldr");
    expect(canonicalSourceName("tldr:ai")).toBe("tldr");
  });

  it("prefix'i olmayan isimleri olduğu gibi bırakır", () => {
    expect(canonicalSourceName("producthunt")).toBe("producthunt");
  });
});

describe("computeSourceHealth", () => {
  // Kaynak listesi 5 -> 16'ya çıktı (fintech/e-ticaret sektör boşluğu, 2026-08-25). Test
  // sabit listeye bağlıydı ve o turda güncellenmemişti; artık KNOWN_SOURCES'tan türetiliyor
  // ki yeni kaynak eklemek testi bir daha kırmasın.
  it("veri yokken bilinen kaynakların hepsi 'never' ile döner", () => {
    const health = computeSourceHealth([], NOW);
    expect(health.map((h) => h.name)).toEqual([...KNOWN_SOURCES].sort());
    expect(health).toHaveLength(KNOWN_SOURCES.length);
    expect(health.every((h) => h.status === "never" && h.last7d === 0 && h.last30d === 0)).toBe(true);
  });

  it("son 2 gün içindeyse 'ok'", () => {
    const health = computeSourceHealth([{ source: "producthunt", fetched_at: hoursAgo(1) }], NOW);
    const ph = health.find((h) => h.name === "producthunt")!;
    expect(ph.status).toBe("ok");
    expect(ph.last7d).toBe(1);
    expect(ph.last30d).toBe(1);
  });

  it("2-7 gün arası 'warn'", () => {
    const health = computeSourceHealth([{ source: "webrazzi", fetched_at: daysAgo(3) }], NOW);
    expect(health.find((h) => h.name === "webrazzi")!.status).toBe("warn");
  });

  it("7 günden eski 'critical'", () => {
    const health = computeSourceHealth([{ source: "ycombinator", fetched_at: daysAgo(10) }], NOW);
    expect(health.find((h) => h.name === "ycombinator")!.status).toBe("critical");
  });

  it("tldr:founders ve tldr:ai aynı 'tldr' kovasında toplanır", () => {
    const health = computeSourceHealth(
      [
        { source: "tldr:founders", fetched_at: hoursAgo(1) },
        { source: "tldr:ai", fetched_at: hoursAgo(2) },
      ],
      NOW,
    );
    const tldr = health.find((h) => h.name === "tldr")!;
    expect(tldr.last7d).toBe(2);
    expect(tldr.status).toBe("ok");
  });

  it("30 günden eski satırlar last30d/last7d'ye sayılmaz ama lastSeen güncellenir", () => {
    const health = computeSourceHealth([{ source: "techcrunch", fetched_at: daysAgo(45) }], NOW);
    const tc = health.find((h) => h.name === "techcrunch")!;
    expect(tc.last7d).toBe(0);
    expect(tc.last30d).toBe(0);
    expect(tc.lastSeen).not.toBeNull();
    expect(tc.status).toBe("critical");
  });

  it("en son fetched_at satırı lastSeen olarak seçilir (en yeni kazanır)", () => {
    const health = computeSourceHealth(
      [
        { source: "producthunt", fetched_at: daysAgo(5) },
        { source: "producthunt", fetched_at: hoursAgo(1) },
        { source: "producthunt", fetched_at: daysAgo(1) },
      ],
      NOW,
    );
    const ph = health.find((h) => h.name === "producthunt")!;
    expect(ph.lastSeen?.toISOString()).toBe(hoursAgo(1));
  });

  it("bilinmeyen kaynak adı sessizce düşürülmez, kendi kovasında görünür", () => {
    const health = computeSourceHealth([{ source: "yeni-kaynak", fetched_at: hoursAgo(1) }], NOW);
    expect(health.find((h) => h.name === "yeni-kaynak")).toBeDefined();
  });

  it("geçersiz/parse edilemeyen fetched_at atlanır, çökmez", () => {
    const health = computeSourceHealth([{ source: "producthunt", fetched_at: "gecersiz-tarih" }], NOW);
    expect(health.find((h) => h.name === "producthunt")!.status).toBe("never");
  });
});
