import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, serverDbMock, authEnabledMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  serverDbMock: vi.fn(),
  authEnabledMock: vi.fn(),
}));
vi.mock("../../../lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../lib/session", () => ({ authEnabled: authEnabledMock }));

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/decisions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/decisions", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    serverDbMock.mockReset();
    authEnabledMock.mockReset();
    getSessionMock.mockResolvedValue(null);
    authEnabledMock.mockReturnValue(false);
  });

  it("auth açık ama oturum yoksa 401 döner (middleware'e tek başına güvenmez — /cso #3)", async () => {
    authEnabledMock.mockReturnValue(true);
    const res = await POST(req({ signal_id: "s1", decision: "pursue" }));
    expect(res.status).toBe(401);
  });

  it("signal_id eksikse 400 döner", async () => {
    const res = await POST(req({ decision: "pursue" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "geçersiz istek" });
  });

  it("decision VALID setinde değilse 400 döner", async () => {
    const res = await POST(req({ signal_id: "s1", decision: "maybe" }));
    expect(res.status).toBe(400);
  });

  it("db yoksa (lokal/demo) DB'ye dokunmadan ok:true demo:true döner", async () => {
    serverDbMock.mockReturnValue(null);
    const res = await POST(req({ signal_id: "s1", decision: "pursue" }));
    expect(await res.json()).toEqual({ ok: true, demo: true });
  });

  it("oturum kullanıcı adını decided_by olarak append-only insert eder", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ signal_id: "s1", decision: "kill" }));
    expect(from).toHaveBeenCalledWith("decisions");
    expect(insert).toHaveBeenCalledWith({ signal_id: "s1", decision: "kill", decided_by: "enes" });
    expect(await res.json()).toEqual({ ok: true });
  });

  it("oturum yoksa decided_by 'web' olur", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });
    await POST(req({ signal_id: "s1", decision: "watch" }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ decided_by: "web" }));
  });

  it("DB hatasında 500 ve hata mesajı döner", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "db patladı" } });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });
    const res = await POST(req({ signal_id: "s1", decision: "pursue" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "db patladı" });
  });
});
