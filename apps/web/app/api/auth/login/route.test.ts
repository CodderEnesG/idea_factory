import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  serverDbMock,
  signSessionMock,
  verifyPasswordConstantTimeMock,
  checkLockedMock,
  recordFailureMock,
  recordSuccessMock,
  cookieSetMock,
} = vi.hoisted(() => ({
  serverDbMock: vi.fn(),
  signSessionMock: vi.fn(),
  verifyPasswordConstantTimeMock: vi.fn(),
  checkLockedMock: vi.fn(),
  recordFailureMock: vi.fn(),
  recordSuccessMock: vi.fn(),
  cookieSetMock: vi.fn(),
}));

vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../../lib/session", () => ({
  signSession: signSessionMock,
  SESSION_COOKIE: "if_session",
  SESSION_MAX_AGE: 2_592_000,
}));
vi.mock("../../../../lib/password", () => ({
  verifyPasswordConstantTime: verifyPasswordConstantTimeMock,
}));
vi.mock("../../../../lib/rate-limit", () => ({
  checkLocked: checkLockedMock,
  recordFailure: recordFailureMock,
  recordSuccess: recordSuccessMock,
}));
vi.mock("next/headers", () => ({
  cookies: () => ({ set: cookieSetMock }),
}));

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const MEMBER_ROW = {
  username: "enes",
  display_name: "Enes",
  password_hash: "stored-hash",
  is_admin: true,
};

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    serverDbMock.mockReset();
    signSessionMock.mockReset();
    verifyPasswordConstantTimeMock.mockReset();
    checkLockedMock.mockReset();
    recordFailureMock.mockReset();
    recordSuccessMock.mockReset();
    cookieSetMock.mockReset();
    checkLockedMock.mockReturnValue(null);
    signSessionMock.mockResolvedValue("signed-jwt");
  });

  it("kullanıcı adı/parola eksikse 400 döner", async () => {
    const res = await POST(req({ username: "enes" }));
    expect(res.status).toBe(400);
  });

  it("kilitliyse (rate-limit) DB'ye hiç dokunmadan 429 döner", async () => {
    checkLockedMock.mockReturnValue(90_000); // 90s kaldı
    const res = await POST(req({ username: "enes", password: "x" }));
    expect(res.status).toBe(429);
    expect(serverDbMock).not.toHaveBeenCalled();
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    serverDbMock.mockReturnValue(null);
    const res = await POST(req({ username: "enes", password: "x" }));
    expect(res.status).toBe(503);
  });

  it("kullanıcı yoksa bile constant-time karşılaştırma çağrılır (timing enum fix) ve 401 + recordFailure", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    serverDbMock.mockReturnValue({ from });
    verifyPasswordConstantTimeMock.mockReturnValue(false);

    const res = await POST(req({ username: "Enes", password: "yanlis" }));
    expect(res.status).toBe(401);
    expect(verifyPasswordConstantTimeMock).toHaveBeenCalledWith("yanlis", undefined);
    expect(recordFailureMock).toHaveBeenCalledWith("enes"); // lowercased key
  });

  it("yanlış parolada 401 + recordFailure, session imzalanmaz", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: MEMBER_ROW, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    serverDbMock.mockReturnValue({ from });
    verifyPasswordConstantTimeMock.mockReturnValue(false);

    const res = await POST(req({ username: "enes", password: "yanlis" }));
    expect(res.status).toBe(401);
    expect(recordFailureMock).toHaveBeenCalledWith("enes");
    expect(signSessionMock).not.toHaveBeenCalled();
  });

  it("doğru girişte recordSuccess çağrılır, cookie set edilir, password_hash asla client'a dönmez", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: MEMBER_ROW, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    serverDbMock.mockReturnValue({ from });
    verifyPasswordConstantTimeMock.mockReturnValue(true);

    const res = await POST(req({ username: "enes", password: "dogru" }));
    expect(res.status).toBe(200);
    expect(recordSuccessMock).toHaveBeenCalledWith("enes");
    expect(signSessionMock).toHaveBeenCalledWith({
      username: "enes",
      display_name: "Enes",
      is_admin: true,
    });
    expect(cookieSetMock).toHaveBeenCalledWith(
      "if_session",
      "signed-jwt",
      expect.objectContaining({ httpOnly: true, maxAge: 2_592_000 }),
    );
    const json = await res.json();
    expect(json).toEqual({ ok: true, display_name: "Enes" });
    expect(JSON.stringify(json)).not.toContain("stored-hash");
  });
});
