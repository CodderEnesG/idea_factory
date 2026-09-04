import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, serverDbMock, loadActiveThesisMock, runDebateMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  serverDbMock: vi.fn(),
  loadActiveThesisMock: vi.fn(),
  runDebateMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));
vi.mock("../../../../lib/active-thesis", () => ({ loadActiveThesis: loadActiveThesisMock }));
vi.mock("@idea-factory/core", () => ({
  runDebate: runDebateMock,
  DEBATE_TOTAL_TURNS: 7,
}));

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/debates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function readNdjson(res: Response): Promise<unknown[]> {
  const text = await res.text();
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("POST /api/admin/debates", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    serverDbMock.mockReset();
    loadActiveThesisMock.mockReset();
    runDebateMock.mockReset();
  });

  it("admin oturumu yoksa 403 döner (stream başlamaz)", async () => {
    requireAdminMock.mockResolvedValue(null);
    const res = await POST(req({ signal_id: "s1" }));
    expect(res.status).toBe(403);
  });

  it("signal_id eksikse 400 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    serverDbMock.mockReturnValue(null);
    const res = await POST(req({ signal_id: "s1" }));
    expect(res.status).toBe(503);
  });

  it("sinyal bulunamazsa 404 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
    });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ signal_id: "yok" }));
    expect(res.status).toBe(404);
  });

  it("mutlu yolda tur ilerlemesini stream eder ve tartışmayı debates tablosuna kaydeder", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    loadActiveThesisMock.mockResolvedValue({ sectors: ["SaaS"] });

    const signalRow = { id: "s1", title: "Test Sinyali" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: signalRow, error: null });
    const insertedDebate = {
      id: "d1",
      transcript: [],
      final_verdict: "watch",
      final_commentary: "özet",
      created_by: "enes",
      created_at: "t",
    };
    const single = vi.fn().mockResolvedValue({ data: insertedDebate, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "signals") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) };
      }
      return { insert };
    });
    serverDbMock.mockReturnValue({ from });

    runDebateMock.mockImplementation(async (_signal: unknown, opts: { onTurn: (i: unknown) => void }) => {
      opts.onTurn({ index: 1, total: 7, speaker: "arbitrage" });
      return { transcript: [], final_verdict: "watch", final_commentary: "özet" };
    });

    const res = await POST(req({ signal_id: "s1" }));
    const events = await readNdjson(res);

    expect(events[0]).toEqual({ type: "progress", index: 0, total: 7, speaker: null });
    expect(events[1]).toEqual({ type: "progress", index: 1, total: 7, speaker: "arbitrage" });
    // 0014: elle tetiklenen tartışma `kind='manual'` — kapı turu DEĞİL (yalnız 'auto'
    // satırları kapıyı kapatır, aksi halde tek bir manuel tetikleme kapıyı erken kapatırdı).
    expect(events[2]).toEqual({
      type: "done",
      debate: { ...insertedDebate, kind: "manual", run_no: null, turn_count: 0 },
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ signal_id: "s1", created_by: "enes", final_verdict: "watch", kind: "manual" }),
    );
  });

  it("runDebate hata atarsa stream error olayıyla kapanır (kayıt denenmez)", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    loadActiveThesisMock.mockResolvedValue({ sectors: ["SaaS"] });

    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "s1" }, error: null });
    const insert = vi.fn();
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "signals") {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) };
      }
      return { insert };
    });
    serverDbMock.mockReturnValue({ from });
    runDebateMock.mockRejectedValue(new Error("LLM zaman aşımı"));

    const res = await POST(req({ signal_id: "s1" }));
    const events = await readNdjson(res);

    expect(events.at(-1)).toEqual({ type: "error", error: "LLM zaman aşımı" });
    expect(insert).not.toHaveBeenCalled();
  });
});
