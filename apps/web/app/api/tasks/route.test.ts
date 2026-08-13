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
  return new Request("http://localhost/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/tasks", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    serverDbMock.mockReset();
    authEnabledMock.mockReset();
    getSessionMock.mockResolvedValue(null);
    authEnabledMock.mockReturnValue(false);
  });

  it("auth açık ama oturum yoksa 401 döner (middleware'e tek başına güvenmez — /cso #3)", async () => {
    authEnabledMock.mockReturnValue(true);
    const res = await POST(req({ signal_id: "s1", body: "görev" }));
    expect(res.status).toBe(401);
  });

  it("signal_id eksikse 400 döner", async () => {
    const res = await POST(req({ body: "görev" }));
    expect(res.status).toBe(400);
  });

  it("boş/whitespace görev metni 400 döner", async () => {
    const res = await POST(req({ signal_id: "s1", body: "   " }));
    expect(res.status).toBe(400);
  });

  it("db yoksa demo görev döner, DB'ye dokunmaz", async () => {
    serverDbMock.mockReturnValue(null);
    const res = await POST(req({ signal_id: "s1", body: "kurucuyla görüş" }));
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.demo).toBe(true);
    expect(json.task.body).toBe("kurucuyla görüş");
    expect(json.task.done).toBe(false);
  });

  it("oturum varsa owner olarak kullanılır ve trim edilmiş metin insert edilir", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const single = vi
      .fn()
      .mockResolvedValue({ data: { id: "t1", body: "net", done: false, created_at: "t" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ signal_id: "s1", body: "  net  " }));
    expect(from).toHaveBeenCalledWith("item_tasks");
    expect(insert).toHaveBeenCalledWith({ signal_id: "s1", owner: "enes", body: "net" });
    expect(await res.json()).toEqual({
      ok: true,
      task: { id: "t1", body: "net", done: false, created_at: "t" },
    });
  });

  it("oturum yoksa owner 'web' olur", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "t1", body: "x", done: false, created_at: "t" }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });
    await POST(req({ signal_id: "s1", body: "x" }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ owner: "web" }));
  });

  it("DB hatasında 500 döner", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "insert başarısız" } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ signal_id: "s1", body: "x" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "insert başarısız" });
  });
});
