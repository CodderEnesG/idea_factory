import { describe, it, expect } from "vitest";
import { resolveEffectiveBand } from "./card-view";

describe("resolveEffectiveBand — Kesinleşmiş > kişisel > AI Yorumcusu > AI bandı", () => {
  it("hiçbiri yokken ham AI bandına düşer", () => {
    expect(resolveEffectiveBand("kill", null, null, null)).toBe("kill");
  });

  it("yalnız AI Yorumcusu varsa onu kullanır (AI bandını ezer)", () => {
    expect(resolveEffectiveBand("kill", null, null, "watch")).toBe("watch");
  });

  it("kişisel karar AI Yorumcusu'nu ezer", () => {
    expect(resolveEffectiveBand("kill", "pursue", null, "watch")).toBe("pursue");
  });

  it("kesinleşmiş karar her şeyi ezer", () => {
    expect(resolveEffectiveBand("kill", "pursue", "watch", "watch")).toBe("watch");
  });

  it("kesinleşmiş yoksa ve kişisel de yoksa AI Yorumcusu'na düşer, o da yoksa AI bandına", () => {
    expect(resolveEffectiveBand("pursue", null, null, null)).toBe("pursue");
    expect(resolveEffectiveBand("pursue", null, null, "kill")).toBe("kill");
  });
});
