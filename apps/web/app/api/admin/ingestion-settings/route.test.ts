import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, serverDbMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  serverDbMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));

import { POST } from "./route";

const VALID_BODY = { per_source_limit: 20, concurrency: 3 };

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/ingestion-settings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/ingestion-settings", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    serverDbMock.mockReset();
  });

  it("admin oturumu yoksa 403 döner", async () => {
    requireAdminMock.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it.each([
    { per_source_limit: -1, concurrency: 1 },
    { per_source_limit: 1.5, concurrency: 1 },
    { per_source_limit: 10, concurrency: 0 },
    { per_source_limit: 10, concurrency: 6 },
  ])("geçersiz gövde 400 döner: %o", async (body) => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const res = await POST(req(body));
    expect(res.status).toBe(400);
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    serverDbMock.mockReturnValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it("mevcut aktif versiyonları pasifleyip yeni versiyonu artan numarayla ekler (0 = sınırsız geçerli)", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });

    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ count: 2 }),
      update,
      insert,
    });
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ per_source_limit: 0, concurrency: 1 }));
    expect(await res.json()).toEqual({ ok: true, version: "v3" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        version: "v3",
        config: { per_source_limit: 0, concurrency: 1 },
        is_active: true,
        created_by: "enes",
      }),
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
