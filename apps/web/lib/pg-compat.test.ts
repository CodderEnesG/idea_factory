import { describe, it, expect } from "vitest";
import { isMissingColumn } from "./pg-compat";

/**
 * Migration'lar Supabase Dashboard'dan elle uygulanıyor, yani kod ile şema arasında bir
 * pencere var. Gerçek yanıtlar (2026-08-26, canlı DB'ye karşı doğrulandı):
 *   debates.kind      -> {"code":"42703","message":"column debates.kind does not exist"}
 *   lenses.grounding  -> {"code":"42703","message":"column lenses.grounding does not exist"}
 */
describe("isMissingColumn", () => {
  it("42703 kodunu tanır", () => {
    expect(isMissingColumn({ code: "42703", message: "column debates.kind does not exist" })).toBe(true);
  });

  it("kod gelmese bile mesajdan anlar", () => {
    expect(isMissingColumn({ message: "column lenses.grounding does not exist" })).toBe(true);
  });

  it("hata yoksa false", () => {
    expect(isMissingColumn(null)).toBe(false);
  });

  it("BAŞKA hataları yutmaz — ağ/yetki hatası fallback'i tetiklememeli", () => {
    expect(isMissingColumn({ code: "42501", message: "permission denied" })).toBe(false);
    expect(isMissingColumn({ message: "fetch failed" })).toBe(false);
    expect(isMissingColumn({ code: "PGRST301", message: "JWT expired" })).toBe(false);
  });
});
