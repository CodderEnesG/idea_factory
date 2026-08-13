import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, serverDbMock, authEnabledMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  serverDbMock: vi.fn(),
  authEnabledMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../../lib/session", () => ({ authEnabled: authEnabledMock }));

import { PATCH } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/tasks/t1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const params = { params: { taskId: "t1" } };

/** update().eq()...eq()...select() zincirini tek bir chainable nesneyle taklit eder —
 *  admin (tek eq) ve normal kullanıcı (iki eq) yollarının ikisini de destekler. */
function chainDb(result: { data: unknown[] | null; error: { message: string } | null }) {
  const chain: Record<string, unknown> = {};
  chain["eq"] = vi.fn().mockReturnValue(chain);
  chain["select"] = vi.fn().mockResolvedValue(result);
  const update = vi.fn().mockReturnValue(chain);
  const from = vi.fn().mockReturnValue({ update });
  return { from, update, chain };
}

describe("PATCH /api/tasks/[taskId]", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    serverDbMock.mockReset();
    authEnabledMock.mockReset();
    getSessionMock.mockResolvedValue(null);
    authEnabledMock.mockReturnValue(false);
  });

  it("auth açık ama oturum yoksa 401 döner", async () => {
    authEnabledMock.mockReturnValue(true);
    const res = await PATCH(req({ done: true }), params);
    expect(res.status).toBe(401);
  });

  it("done boolean değilse 400 döner", async () => {
    const res = await PATCH(req({ done: "yes" }), params);
    expect(res.status).toBe(400);
  });

  it("db yoksa (lokal/demo) DB'ye dokunmadan ok:true demo:true döner", async () => {
    serverDbMock.mockReturnValue(null);
    const res = await PATCH(req({ done: true }), params);
    expect(await res.json()).toEqual({ ok: true, demo: true });
  });

  it("admin olmayan kullanıcı yalnız kendi görevini günceller (owner eq'ı eklenir)", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const { from, update, chain } = chainDb({ data: [{ id: "t1" }], error: null });
    serverDbMock.mockReturnValue({ from });

    const res = await PATCH(req({ done: true }), params);
    expect(from).toHaveBeenCalledWith("item_tasks");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ done: true }));
    expect(chain["eq"]).toHaveBeenCalledWith("id", "t1");
    expect(chain["eq"]).toHaveBeenCalledWith("owner", "enes");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("admin owner eq'ı eklemeden günceller", async () => {
    getSessionMock.mockResolvedValue({ username: "admin1", display_name: "Admin", is_admin: true });
    const { from, chain } = chainDb({ data: [{ id: "t1" }], error: null });
    serverDbMock.mockReturnValue({ from });

    await PATCH(req({ done: false }), params);
    expect((chain["eq"] as ReturnType<typeof vi.fn>).mock.calls).toEqual([["id", "t1"]]);
  });

  it("eşleşen görev yoksa 404 döner", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const { from } = chainDb({ data: [], error: null });
    serverDbMock.mockReturnValue({ from });

    const res = await PATCH(req({ done: true }), params);
    expect(res.status).toBe(404);
  });

  it("DB hatasında 500 döner", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const { from } = chainDb({ data: null, error: { message: "update başarısız" } });
    serverDbMock.mockReturnValue({ from });

    const res = await PATCH(req({ done: true }), params);
    expect(res.status).toBe(500);
  });
});
