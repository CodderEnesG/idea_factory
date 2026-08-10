import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, serverDbMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  serverDbMock: vi.fn(),
}));
vi.mock("../../../../../lib/auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("../../../../../lib/supabase", () => ({ serverDb: serverDbMock }));

import { PATCH } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/lenses/x", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

const params = { params: { lensId: "zamanlama" } };

describe("PATCH /api/admin/lenses/[lensId]", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    serverDbMock.mockReset();
  });

  it("admin oturumu yoksa 403 döner", async () => {
    requireAdminMock.mockResolvedValue(null);
    const res = await PATCH(req({ active: false }), params);
    expect(res.status).toBe(403);
  });

  it("değişiklik alanı yoksa 400 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const res = await PATCH(req({ irrelevant: true }), params);
    expect(res.status).toBe(400);
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    serverDbMock.mockReturnValue(null);
    const res = await PATCH(req({ active: false }), params);
    expect(res.status).toBe(503);
  });

  it("yalnız geçerli alanları patch'e alır ve lens_id ile eşleştirir", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    serverDbMock.mockReturnValue({ from });

    const res = await PATCH(
      req({ active: false, name: "  Yeni İsim  ", weight: -5, questions: [] }),
      params,
    );
    expect(from).toHaveBeenCalledWith("lenses");
    // weight<=0 ve boş questions göz ardı edilmeli, name trim edilmeli
    expect(update).toHaveBeenCalledWith({ active: false, name: "Yeni İsim" });
    expect(eq).toHaveBeenCalledWith("lens_id", "zamanlama");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("DB hatasında 500 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const eq = vi.fn().mockResolvedValue({ error: { message: "update başarısız" } });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    serverDbMock.mockReturnValue({ from });

    const res = await PATCH(req({ active: true }), params);
    expect(res.status).toBe(500);
  });
});
