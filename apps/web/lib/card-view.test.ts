import { describe, expect, it } from "vitest";
import { resolveGatedBand, resolvePanomBand } from "./card-view";

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

  it("kovala + iki tur da ele → VETO (2026-09-14: yalnız çift ele düşürür)", () => {
    expect(resolveGatedBand("pursue", ["kill", "kill"])).toEqual({ band: "kill", gate: "vetoed" });
  });

  it("tek ele oyu kartı YAKMAZ — diğer tur kovala ise onaylı, izle ise çekinceli ama kovala", () => {
    expect(resolveGatedBand("pursue", ["pursue", "kill"])).toEqual({ band: "pursue", gate: "confirmed" });
    expect(resolveGatedBand("pursue", ["kill", "watch"])).toEqual({ band: "pursue", gate: "caveat" });
  });

  it("kovala + en az biri kovala → ONAYLI", () => {
    expect(resolveGatedBand("pursue", ["pursue", "watch"])).toEqual({
      band: "pursue",
      gate: "confirmed",
    });
    expect(resolveGatedBand("pursue", ["pursue", "pursue"])).toEqual({
      band: "pursue",
      gate: "confirmed",
    });
  });

  it("kovala + ikisi de izle → KOVALA'da kalır, gate ÇEKİNCELİ", () => {
    // 2026-09-14 gevşetme: sıkı okuma 101 AI-kovalanın ~7'sini bırakıyordu (oyların %74'ü ele).
    expect(resolveGatedBand("pursue", ["watch", "watch"])).toEqual({
      band: "pursue",
      gate: "caveat",
    });
  });

  it("üçüncü tur da varsa (mükerrer kayıt) iki ele yine veto sayılır", () => {
    expect(resolveGatedBand("pursue", ["watch", "kill", "kill"])).toEqual({
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
