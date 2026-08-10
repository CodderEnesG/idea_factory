import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, serverDbMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  serverDbMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));

import { POST } from "./route";

const VALID_BODY = {
  capital_range: "50k-200k$",
  risk_appetite: "orta",
  target_markets: ["TR"],
  sectors: ["SaaS"],
  capabilities: ["arbitraj"],
  anti_patterns: [],
};

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/thesis", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/thesis", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    serverDbMock.mockReset();
  });

  it("admin oturumu yoksa 403 döner", async () => {
    requireAdminMock.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it("admin oturumu var ama gövde geçersizse 400 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const res = await POST(req({ ...VALID_BODY, sectors: [] }));
    expect(res.status).toBe(400);
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    serverDbMock.mockReturnValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it("mevcut aktif versiyonları pasifleyip yeni versiyonu artan numarayla ekler", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });

    const selectHead = vi.fn().mockResolvedValue({ count: 3 });
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(selectHead()),
      update,
      insert,
    });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req(VALID_BODY));
    expect(await res.json()).toEqual({ ok: true, version: "v4" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ version: "v4", is_active: true, created_by: "enes" }),
    );
  });

  it("pasifleştirme hata verirse 500 döner ve insert denenmez", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });

    const insert = vi.fn();
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "pasifleştirme başarısız" } }),
      }),
      insert,
    });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(500);
    expect(insert).not.toHaveBeenCalled();
  });
});
