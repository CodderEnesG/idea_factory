import { afterEach, describe, expect, it } from "vitest";
import { stageModel } from "./stage-model.js";

describe("stageModel", () => {
  afterEach(() => {
    for (const k of ["ENRICH_MODEL", "TRIAGE_MODEL", "ANALYZE_MODEL", "DEBATE_MODEL"]) delete process.env[k];
  });

  it("aşama env'i set değilse undefined (sağlayıcı varsayılanına düşer)", () => {
    expect(stageModel("analyze")).toBeUndefined();
  });

  it("aşamaya özel env'i okur, diğer aşamalara sızmaz", () => {
    process.env["ANALYZE_MODEL"] = "gemini-x-pro";
    expect(stageModel("analyze")).toBe("gemini-x-pro");
    expect(stageModel("enrich")).toBeUndefined();
  });

  it("boş/boşluk değer set edilmemiş sayılır", () => {
    process.env["DEBATE_MODEL"] = "  ";
    expect(stageModel("debate")).toBeUndefined();
  });
});
