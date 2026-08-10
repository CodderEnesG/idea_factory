import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkLocked, recordFailure, recordSuccess } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hiç deneme yoksa kilitli değildir", () => {
    expect(checkLocked("yeni-kullanici")).toBeNull();
  });

  it("4 başarısız denemede henüz kilitlemez (eşik 5)", () => {
    const key = "user-a";
    for (let i = 0; i < 4; i++) recordFailure(key);
    expect(checkLocked(key)).toBeNull();
  });

  it("5. başarısız denemede kilitler", () => {
    const key = "user-b";
    for (let i = 0; i < 5; i++) recordFailure(key);
    expect(checkLocked(key)).not.toBeNull();
    expect(checkLocked(key)!).toBeGreaterThan(0);
  });

  it("kilit süresi dolunca tekrar izin verir", () => {
    const key = "user-c";
    for (let i = 0; i < 5; i++) recordFailure(key);
    expect(checkLocked(key)).not.toBeNull();
    vi.advanceTimersByTime(5 * 60_000 + 1);
    expect(checkLocked(key)).toBeNull();
  });

  it("başarı sayaç/kilidi sıfırlar", () => {
    const key = "user-d";
    for (let i = 0; i < 5; i++) recordFailure(key);
    expect(checkLocked(key)).not.toBeNull();
    recordSuccess(key);
    expect(checkLocked(key)).toBeNull();
  });

  it("pencere dışına taşan eski başarısızlıklar sayılmaz", () => {
    const key = "user-e";
    for (let i = 0; i < 4; i++) recordFailure(key);
    vi.advanceTimersByTime(5 * 60_000 + 1); // pencere kapandı
    recordFailure(key); // sayaç sıfırdan başlar (1)
    expect(checkLocked(key)).toBeNull();
  });

  it("farklı kullanıcı anahtarları birbirini etkilemez", () => {
    for (let i = 0; i < 5; i++) recordFailure("victim");
    expect(checkLocked("victim")).not.toBeNull();
    expect(checkLocked("bystander")).toBeNull();
  });
});
