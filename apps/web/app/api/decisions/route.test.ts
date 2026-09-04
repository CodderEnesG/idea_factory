import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, serverDbMock, authEnabledMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  serverDbMock: vi.fn(),
  authEnabledMock: vi.fn(),
}));
vi.mock("../../../lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../lib/session", () => ({ authEnabled: authEnabledMock }));

/** `seedStarterTasks` artık en yüksek fit'li analizin `validation_needed`'ini okuyor
 *  (FAZ6_PLAN.md §Faz 6.4) — jenerik şablon yalnız son çare. Bu sahte tablo o sorguyu karşılar. */
function analysesStub(validation: unknown[] | null = null) {
  const obj: Record<string, unknown> = {};
  obj.select = vi.fn(() => obj);
  obj.eq = vi.fn(() => obj);
  obj.order = vi.fn(() => obj);
  obj.limit = vi.fn(() => Promise.resolve({ data: validation ? [{ validation_needed: validation, fit: 88 }] : [] }));
  return obj;
}

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

  it("kovala ilk kez seçilince ve hiç görev yoksa başlangıç görevleri eklenir (problem 3)", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const decisionsInsert = vi.fn().mockResolvedValue({ error: null });
    let taskMode: "count" | "insert" = "count";
    const tasksObj: Record<string, unknown> = {};
    tasksObj.select = vi.fn(() => {
      taskMode = "count";
      return tasksObj;
    });
    tasksObj.eq = vi.fn(() => tasksObj);
    tasksObj.insert = vi.fn((rows: unknown[]) => {
      taskMode = "insert";
      (tasksObj as { insertedRows?: unknown }).insertedRows = rows;
      return tasksObj;
    });
    (tasksObj as { then: unknown }).then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(taskMode === "count" ? { count: 0 } : { error: null }).then(resolve);

    const analysesObj = analysesStub();
    const from = vi.fn((t: string) => ({ decisions: { insert: decisionsInsert }, item_tasks: tasksObj, analyses: analysesObj })[t]);
    serverDbMock.mockReturnValue({ from });

    await POST(req({ signal_id: "s1", decision: "pursue" }));
    expect(tasksObj.insert).toHaveBeenCalledTimes(1);
    const rows = (tasksObj as { insertedRows?: { signal_id: string; owner: string }[] }).insertedRows!;
    expect(rows.every((r) => r.signal_id === "s1" && r.owner === "enes")).toBe(true);
  });

  it("kovala seçilince ama zaten görev varsa başlangıç görevleri eklenmez", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const decisionsInsert = vi.fn().mockResolvedValue({ error: null });
    const tasksObj: Record<string, unknown> = {};
    tasksObj.select = vi.fn(() => tasksObj);
    tasksObj.eq = vi.fn(() => tasksObj);
    tasksObj.insert = vi.fn(() => tasksObj);
    (tasksObj as { then: unknown }).then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ count: 3 }).then(resolve);

    const analysesObj = analysesStub();
    const from = vi.fn((t: string) => ({ decisions: { insert: decisionsInsert }, item_tasks: tasksObj, analyses: analysesObj })[t]);
    serverDbMock.mockReturnValue({ from });

    await POST(req({ signal_id: "s1", decision: "pursue" }));
    expect(tasksObj.insert).not.toHaveBeenCalled();
  });

  it("izle/ele seçilince başlangıç görevleri hiç kontrol edilmez", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const decisionsInsert = vi.fn().mockResolvedValue({ error: null });
    const tasksSelect = vi.fn();
    const analysesObj = analysesStub();
    const from = vi.fn((t: string) => ({ decisions: { insert: decisionsInsert }, item_tasks: { select: tasksSelect } })[t]);
    serverDbMock.mockReturnValue({ from });

    await POST(req({ signal_id: "s1", decision: "watch" }));
    expect(tasksSelect).not.toHaveBeenCalled();
  });
});
