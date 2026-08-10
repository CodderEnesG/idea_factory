import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, serverDbMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  serverDbMock: vi.fn(),
}));
vi.mock("../../../../lib/auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("../../../../lib/supabase", () => ({ serverDb: serverDbMock }));

import { POST } from "./route";

function req(body: unknown): Request {
  return new Request("http://localhost/api/admin/lenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Verilen lens_id kümesindeki kayıtları "zaten var" gibi davranan basit bir db mock'u kurar. */
function makeDb(existingLensIds: string[] = []) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockImplementation((_col: string, val: string) => ({
        maybeSingle: vi
          .fn()
          .mockResolvedValue({ data: existingLensIds.includes(val) ? { lens_id: val } : null }),
      })),
    }),
    insert,
  });
  return { from, insert };
}

const VALID_BODY = {
  name: "Zamanlama",
  extra_note_label: "Tetikleyici",
  weight: 1,
  questions: ["Neden şimdi?"],
};

describe("POST /api/admin/lenses", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    serverDbMock.mockReset();
  });

  it("admin oturumu yoksa 403 döner", async () => {
    requireAdminMock.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it("questions boşsa 400 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const res = await POST(req({ ...VALID_BODY, questions: [] }));
    expect(res.status).toBe(400);
  });

  it("db yapılandırılmadıysa 503 döner", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    serverDbMock.mockReturnValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it("adı slugify eder ve çakışma yoksa direkt ekler", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const { from, insert } = makeDb([]);
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req(VALID_BODY));
    expect(await res.json()).toEqual({ ok: true, lens_id: "zamanlama" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ lens_id: "zamanlama", created_by: "enes", active: true }),
    );
  });

  it("builtin id ile çakışırsa _custom soneki eklenir (arbitraj/beyaz-alan düzenlenemez)", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const { from, insert } = makeDb([]);
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req({ ...VALID_BODY, name: "arbitrage" }));
    expect(await res.json()).toEqual({ ok: true, lens_id: "arbitrage_custom" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ lens_id: "arbitrage_custom" }));
  });

  it("aynı isimde kayıt zaten varsa numaralı sonek dener", async () => {
    requireAdminMock.mockResolvedValue({ username: "enes", display_name: "Enes", is_admin: true });
    const { from, insert } = makeDb(["zamanlama"]);
    serverDbMock.mockReturnValue({ from });

    const res = await POST(req(VALID_BODY));
    expect(await res.json()).toEqual({ ok: true, lens_id: "zamanlama_2" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ lens_id: "zamanlama_2" }));
  });
});
