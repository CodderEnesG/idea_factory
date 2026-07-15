import { describe, it, expect } from "vitest";
import { SignalSchema } from "./signal.js";
import { shortHash } from "./hash.js";

const valid = {
  id: shortHash("https://x/1"),
  source: "producthunt",
  type: "launch" as const,
  title: "Bir ürün",
  url: "https://x/1",
  summary_raw: "özet",
  market: null,
  sector: null,
  posted_at: null,
  fetched_at: "2026-01-01T00:00:00Z",
  content_hash: shortHash("Bir ürün\nözet"),
};

describe("SignalSchema", () => {
  it("geçerli sinyali kabul eder", () => {
    expect(SignalSchema.safeParse(valid).success).toBe(true);
  });

  it("bozuk url reddedilir", () => {
    expect(SignalSchema.safeParse({ ...valid, url: "değil-url" }).success).toBe(false);
  });

  it("geçersiz type reddedilir", () => {
    expect(SignalSchema.safeParse({ ...valid, type: "blog" }).success).toBe(false);
  });

  it("shortHash deterministik", () => {
    expect(shortHash("aynı")).toBe(shortHash("aynı"));
    expect(shortHash("a")).not.toBe(shortHash("b"));
  });
});
