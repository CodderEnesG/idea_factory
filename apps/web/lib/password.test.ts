import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, verifyPasswordConstantTime } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("doğru parolayı doğrular", () => {
    const stored = hashPassword("guclu-parola-123");
    expect(verifyPassword("guclu-parola-123", stored)).toBe(true);
  });

  it("yanlış parolayı reddeder", () => {
    const stored = hashPassword("guclu-parola-123");
    expect(verifyPassword("baska-parola", stored)).toBe(false);
  });

  it("bozuk format (saltHex/hashHex eksik) false döner, çökmez", () => {
    expect(verifyPassword("x", "bozuk-format")).toBe(false);
  });

  it("aynı parola her seferinde farklı hash üretir (rastgele salt)", () => {
    const a = hashPassword("ayni-parola");
    const b = hashPassword("ayni-parola");
    expect(a).not.toBe(b);
    expect(verifyPassword("ayni-parola", a)).toBe(true);
    expect(verifyPassword("ayni-parola", b)).toBe(true);
  });
});

describe("verifyPasswordConstantTime (/cso #2 — timing enumeration fix)", () => {
  it("gerçek hash + doğru parolada true döner", () => {
    const stored = hashPassword("dogru-parola");
    expect(verifyPasswordConstantTime("dogru-parola", stored)).toBe(true);
  });

  it("gerçek hash + yanlış parolada false döner", () => {
    const stored = hashPassword("dogru-parola");
    expect(verifyPasswordConstantTime("yanlis", stored)).toBe(false);
  });

  it("stored null/undefined olsa bile (kullanıcı yok) çökmeden false döner", () => {
    expect(verifyPasswordConstantTime("herhangi", null)).toBe(false);
    expect(verifyPasswordConstantTime("herhangi", undefined)).toBe(false);
  });
});
