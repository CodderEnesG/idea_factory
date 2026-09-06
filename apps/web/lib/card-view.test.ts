import { describe, expect, it } from "vitest";
import { resolveEffectiveBand, resolveGatedBand, resolvePanomBand } from "./card-view";

describe("resolveGatedBand — Yorumcu kapısı", () => {
  it("kapı kapalıysa AI bandı olduğu gibi geçer", () => {
    expect(resolveGatedBand("pursue", [], false)).toEqual({ band: "pursue", gate: "n/a" });
    expect(resolveGatedBand("pursue", ["kill"], false)).toEqual({ band: "pursue", gate: "n/a" });
  });

  it("kovala + hiç tartışma yok → İzle bandında BEKLER (flicker olmaz)", () => {
    expect(resolveGatedBand("pursue", [])).toEqual({ band: "watch", gate: "pending" });
  });

  it("kovala + yalnız 1 tartışma → hâlâ bekler (çift tur şartı)", () => {
    expect(resolveGatedBand("pursue", ["pursue"])).toEqual({ band: "watch", gate: "pending" });
  });

  it("kovala + iki tur, biri ele → VETO", () => {
    expect(resolveGatedBand("pursue", ["pursue", "kill"])).toEqual({ band: "kill", gate: "vetoed" });
    expect(resolveGatedBand("pursue", ["kill", "watch"])).toEqual({ band: "kill", gate: "vetoed" });
    expect(resolveGatedBand("pursue", ["kill", "kill"])).toEqual({ band: "kill", gate: "vetoed" });
  });

  it("kovala + en az biri kovala, ele yok → ONAYLI", () => {
    expect(resolveGatedBand("pursue", ["pursue", "watch"])).toEqual({
      band: "pursue",
      gate: "confirmed",
    });
    expect(resolveGatedBand("pursue", ["pursue", "pursue"])).toEqual({
      band: "pursue",
      gate: "confirmed",
    });
  });

  it("kovala + ikisi de izle → İZLE'ye düşer, gate ÇEKİNCELİ (2026-09-06 kalibrasyonu)", () => {
    // caveat kesinliği %25 (3/12) vs confirmed %60 (3/5) → sıkı okuma. Etiket korunur ki
    // UI "bekleniyor" ile karıştırmasın: turlar tamamlandı, Yorumcu ikna olmadı.
    expect(resolveGatedBand("pursue", ["watch", "watch"])).toEqual({
      band: "watch",
      gate: "caveat",
    });
  });

  it("üçüncü tur da varsa (mükerrer kayıt) kural değişmez", () => {
    expect(resolveGatedBand("pursue", ["watch", "watch", "kill"])).toEqual({
      band: "kill",
      gate: "vetoed",
    });
  });

  it("kovala DIŞI bantta tartışma YÜKSELTEMEZ, yalnız düşürebilir", () => {
    // Eski `debateVerdict ?? aiBand` burada "pursue" döndürüyordu — kapı değil, terfiydi.
    expect(resolveGatedBand("watch", ["pursue", "pursue"])).toEqual({ band: "watch", gate: "n/a" });
    expect(resolveGatedBand("watch", ["kill"])).toEqual({ band: "kill", gate: "n/a" });
    expect(resolveGatedBand("kill", ["pursue", "pursue"])).toEqual({ band: "kill", gate: "n/a" });
  });
});

describe("resolveEffectiveBand — insan kararı kapının üstünde", () => {
  it("hiçbir karar yoksa kapılı bant kalır", () => {
    expect(resolveEffectiveBand("watch", null, null)).toBe("watch");
  });

  it("kişisel karar kapılı bandı ezer (veto edilmiş kartı bile)", () => {
    expect(resolveEffectiveBand("kill", "pursue", null)).toBe("pursue");
  });

  it("kesinleşmiş karar her şeyin üstünde", () => {
    expect(resolveEffectiveBand("pursue", "kill", "watch")).toBe("watch");
    expect(resolveEffectiveBand("kill", null, "pursue")).toBe("pursue");
  });
});

describe("resolvePanomBand — Panom'un kasıtlı farkı", () => {
  it("kesinleşmiş > kişisel > başkasının en son kararı", () => {
    expect(resolvePanomBand("watch", "pursue", "kill")).toBe("pursue");
    expect(resolvePanomBand("watch", null, "kill")).toBe("watch");
    expect(resolvePanomBand(null, null, "kill")).toBe("kill");
  });

  it("hiç insan kararı yoksa null — Panom AI/kapı katmanına HİÇ düşmez", () => {
    expect(resolvePanomBand(null, null, null)).toBeNull();
  });
});
