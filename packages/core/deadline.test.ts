import { describe, it, expect, afterEach } from "vitest";
import {
  Deadline,
  analyzeDeadlineMs,
  debateDeadlineMs,
  isTimeoutError,
  llmTimeoutMs,
  timeoutError,
} from "./deadline.js";

afterEach(() => {
  delete process.env["LLM_TIMEOUT_MS"];
  delete process.env["ANALYZE_DEADLINE_MS"];
  delete process.env["DEBATE_DEADLINE_MS"];
});

describe("bütçe env okuma", () => {
  it("varsayılanlar", () => {
    expect(llmTimeoutMs()).toBe(90000);
    expect(analyzeDeadlineMs()).toBe(240000);
    expect(debateDeadlineMs()).toBe(300000);
  });

  it("env override edilebilir", () => {
    process.env["LLM_TIMEOUT_MS"] = "5000";
    process.env["ANALYZE_DEADLINE_MS"] = "1000";
    process.env["DEBATE_DEADLINE_MS"] = "2000";
    expect(llmTimeoutMs()).toBe(5000);
    expect(analyzeDeadlineMs()).toBe(1000);
    expect(debateDeadlineMs()).toBe(2000);
  });
});

describe("Deadline", () => {
  it("bütçe dolmadan check() fırlatmaz", () => {
    const d = new Deadline(10_000, "analiz");
    expect(d.expired()).toBe(false);
    expect(() => d.check()).not.toThrow();
    expect(d.remaining()).toBeGreaterThan(0);
  });

  it("bütçe dolduğunda etiket + saniye ile fırlatır", () => {
    const d = new Deadline(0, "tartışma");
    expect(d.expired()).toBe(true);
    expect(() => d.check()).toThrow(/tartışma: süre bütçesi aşıldı \(0sn\)/);
  });

  it("extra bilgisi mesaja iliştirilir (hangi turda patladığı görünsün)", () => {
    const d = new Deadline(-1, "tartışma");
    expect(() => d.check("itiraz turu: Şüpheci Yatırımcı")).toThrow(/itiraz turu: Şüpheci Yatırımcı/);
  });
});

describe("timeout hatası ayırt etme", () => {
  it("AbortError/TimeoutError tanınır", () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    const to = new Error("x");
    to.name = "TimeoutError";
    expect(isTimeoutError(abort)).toBe(true);
    expect(isTimeoutError(to)).toBe(true);
  });

  it("kota hatası timeout SAYILMAZ — ikisi log'da ayrılabilmeli", () => {
    expect(isTimeoutError(new Error("429 Resource exhausted"))).toBe(false);
    expect(isTimeoutError("string")).toBe(false);
  });

  it("timeoutError mesajı sağlayıcı + model + süre taşır", () => {
    expect(timeoutError("gemini", "gemini-2.5-flash", 90000).message).toBe(
      "gemini: 90sn zaman aşımı (model=gemini-2.5-flash)",
    );
  });
});
