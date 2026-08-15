import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, serverDbMock, authEnabledMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  serverDbMock: vi.fn(),
  authEnabledMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ getSession: getSessionMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../../lib/session", () => ({ authEnabled: authEnabledMock }));

import { POST, DELETE } from "./route";

function req(method: string, body: unknown): Request {
  return new Request("http://localhost/api/decisions/final", { method, body: JSON.stringify(body) });
}

/** `final_decisions`: yalnız `.upsert()`/`.delete().eq()` sonunda `{error}` döner. */
function finalDecisionsTable(errorMessage: string | null = null) {
  const result = { error: errorMessage ? { message: errorMessage } : null };
  const obj: Record<string, unknown> = {};
  obj.upsert = vi.fn((payload: unknown) => {
    (obj as { payload?: unknown }).payload = payload;
    return obj;
  });
  obj.delete = vi.fn(() => obj);
  obj.eq = vi.fn(() => obj);
  (obj as { then: unknown }).then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return obj as { upsert: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn>; payload?: unknown };
}

/** `signals`: yalnız `.update(payload).eq()` — payload'ı yakalamak için ayrı okunur. */
function signalsTable() {
  const obj: Record<string, unknown> = {};
  obj.update = vi.fn((payload: unknown) => {
    (obj as { payload?: unknown }).payload = payload;
    return obj;
  });
  obj.eq = vi.fn(() => obj);
  (obj as { then: unknown }).then = (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve);
  return obj as { update: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn>; payload?: unknown };
}

/** `item_tasks`: `.select().eq().eq()` (count) veya `.insert([...])` — hangisi son çağrıldıysa o çözülür. */
function itemTasksTable(existingCount: number) {
  let mode: "count" | "insert" = "count";
  const obj: Record<string, unknown> = {};
  obj.select = vi.fn(() => {
    mode = "count";
    return obj;
  });
  obj.eq = vi.fn(() => obj);
  obj.insert = vi.fn((rows: unknown[]) => {
    mode = "insert";
    (obj as { insertedRows?: unknown }).insertedRows = rows;
    return obj;
  });
  (obj as { then: unknown }).then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(mode === "count" ? { count: existingCount } : { error: null }).then(resolve);
  return obj as { select: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn>; insertedRows?: unknown };
}

describe("POST /api/decisions/final", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    serverDbMock.mockReset();
    authEnabledMock.mockReset();
    getSessionMock.mockResolvedValue(null);
    authEnabledMock.mockReturnValue(false);
  });

  it("auth açık ama oturum yoksa 401 döner", async () => {
    authEnabledMock.mockReturnValue(true);
    const res = await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(res.status).toBe(401);
  });

  it("signal_id/decision eksik veya geçersizse 400 döner", async () => {
    expect((await POST(req("POST", { decision: "pursue" }))).status).toBe(400);
    expect((await POST(req("POST", { signal_id: "s1", decision: "maybe" }))).status).toBe(400);
  });

  it("db yoksa (demo) ok:true demo:true döner", async () => {
    serverDbMock.mockReturnValue(null);
    const res = await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(await res.json()).toEqual({ ok: true, demo: true });
  });

  it("herhangi bir üye (admin şartı YOK) kilitleyebilir — final_decisions'a upsert eder", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    const tasks = itemTasksTable(0);
    serverDbMock.mockReturnValue({
      from: (t: string) => ({ final_decisions: finalTable, signals, item_tasks: tasks })[t],
    });

    const res = await POST(req("POST", { signal_id: "s1", decision: "kill" }));
    expect(await res.json()).toEqual({ ok: true });
    expect(finalTable.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ signal_id: "s1", decision: "kill", decided_by: "enes" }),
    );
  });

  it("izle kilitlenince signals.watch_review_at gelecekteki bir tarihe set edilir", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    const tasks = itemTasksTable(0);
    serverDbMock.mockReturnValue({
      from: (t: string) => ({ final_decisions: finalTable, signals, item_tasks: tasks })[t],
    });

    await POST(req("POST", { signal_id: "s1", decision: "watch" }));
    expect(signals.update).toHaveBeenCalledWith({ watch_review_at: expect.any(String) });
    const payload = signals.payload as { watch_review_at: string };
    expect(Date.parse(payload.watch_review_at)).toBeGreaterThan(Date.now());
  });

  it("kovala/ele kilitlenince watch_review_at null'a temizlenir", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    const tasks = itemTasksTable(0);
    serverDbMock.mockReturnValue({
      from: (t: string) => ({ final_decisions: finalTable, signals, item_tasks: tasks })[t],
    });

    await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(signals.update).toHaveBeenCalledWith({ watch_review_at: null });
  });

  it("kovala kilitlenince ve hiç görev yoksa başlangıç görevleri eklenir", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    const tasks = itemTasksTable(0);
    serverDbMock.mockReturnValue({
      from: (t: string) => ({ final_decisions: finalTable, signals, item_tasks: tasks })[t],
    });

    await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(tasks.insert).toHaveBeenCalledTimes(1);
    expect((tasks.insertedRows as { signal_id: string }[]).every((r) => r.signal_id === "s1")).toBe(true);
  });

  it("kovala kilitlenince ama zaten görev varsa tekrar eklenmez", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    const tasks = itemTasksTable(2);
    serverDbMock.mockReturnValue({
      from: (t: string) => ({ final_decisions: finalTable, signals, item_tasks: tasks })[t],
    });

    await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(tasks.insert).not.toHaveBeenCalled();
  });

  it("upsert hata dönerse 500 döner", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable("db patladı");
    serverDbMock.mockReturnValue({ from: () => finalTable });

    const res = await POST(req("POST", { signal_id: "s1", decision: "pursue" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "db patladı" });
  });
});

describe("DELETE /api/decisions/final", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    serverDbMock.mockReset();
    authEnabledMock.mockReset();
    getSessionMock.mockResolvedValue(null);
    authEnabledMock.mockReturnValue(false);
  });

  it("auth açık ama oturum yoksa 401 döner", async () => {
    authEnabledMock.mockReturnValue(true);
    const res = await DELETE(req("DELETE", { signal_id: "s1" }));
    expect(res.status).toBe(401);
  });

  it("signal_id eksikse 400 döner", async () => {
    const res = await DELETE(req("DELETE", {}));
    expect(res.status).toBe(400);
  });

  it("kilidi açar: final_decisions satırını siler ve watch_review_at'i temizler", async () => {
    getSessionMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: false });
    const finalTable = finalDecisionsTable();
    const signals = signalsTable();
    serverDbMock.mockReturnValue({ from: (t: string) => ({ final_decisions: finalTable, signals })[t] });

    const res = await DELETE(req("DELETE", { signal_id: "s1" }));
    expect(await res.json()).toEqual({ ok: true });
    expect(finalTable.delete).toHaveBeenCalled();
    expect(signals.update).toHaveBeenCalledWith({ watch_review_at: null });
  });
});
