import { describe, it, expect, vi, beforeEach } from "vitest";

const { serverDbMock } = vi.hoisted(() => ({ serverDbMock: vi.fn() }));
vi.mock("./supabase", () => ({ serverDb: serverDbMock }));

import { loadItems } from "./load-items";
import { DEMO_ITEMS } from "./demo";

/**
 * FAZ6_PLAN.md §Faz 3 — üç durum ARTIK ayrı. Eskiden üçü de `DEMO_ITEMS` döndürüyor ve UI
 * "Demo modu — Supabase env yok" diyordu; yani gerçek bir DB hatasında ekibe UYDURMA fırsatlar
 * gösteriliyordu ve üstüne gerçek karar verilebiliyordu.
 */
function db(opts: {
  count?: number | null;
  countError?: { message: string } | null;
  pageError?: { message: string } | null;
  rows?: unknown[];
}) {
  const from = vi.fn(() => ({
    select: vi.fn((_sel: string, o?: { head?: boolean }) => {
      if (o?.head) {
        return Promise.resolve({ count: opts.count ?? 0, error: opts.countError ?? null });
      }
      return {
        range: vi.fn(() => Promise.resolve({ data: opts.rows ?? [], error: opts.pageError ?? null })),
      };
    }),
  }));
  return { from };
}

beforeEach(() => {
  serverDbMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("loadItems — üç ayrı durum", () => {
  it("env YOK → demo veri, hata yok (tek meşru DEMO_ITEMS kullanımı)", async () => {
    serverDbMock.mockReturnValue(null);
    const r = await loadItems();
    expect(r.demo).toBe(true);
    expect(r.error).toBeNull();
    expect(r.items).toBe(DEMO_ITEMS);
  });

  it("sayım HATASI → boş liste + hata mesajı, demo DEĞİL", async () => {
    serverDbMock.mockReturnValue(db({ countError: { message: "bağlantı koptu" } }));
    const r = await loadItems();
    expect(r.demo).toBe(false);
    expect(r.error).toBe("bağlantı koptu");
    expect(r.items).toEqual([]);
  });

  it("sayfa HATASI → boş liste + hata mesajı, demo DEĞİL", async () => {
    serverDbMock.mockReturnValue(db({ count: 10, pageError: { message: "timeout" } }));
    const r = await loadItems();
    expect(r.demo).toBe(false);
    expect(r.error).toBe("timeout");
    expect(r.items).toEqual([]);
  });

  it("SIFIR satır, DB sağlıklı → boş durum; taze kurulum 'env yok' diye suçlanmaz", async () => {
    serverDbMock.mockReturnValue(db({ count: 0 }));
    const r = await loadItems();
    expect(r.demo).toBe(false);
    expect(r.error).toBeNull();
    expect(r.items).toEqual([]);
  });

  it("satırlar sinyal başına gruplanır", async () => {
    const signal = { id: "s1", source: "test", title: "T", url: "u", fetched_at: "2026-01-01" };
    serverDbMock.mockReturnValue(
      db({
        count: 2,
        rows: [
          { lens: "arbitrage", fit: 88, signals: signal },
          { lens: "white_space", fit: 30, signals: signal },
        ],
      }),
    );
    const r = await loadItems();
    expect(r.items).toHaveLength(1);
    expect(Object.keys(r.items[0]!.analyses).sort()).toEqual(["arbitrage", "white_space"]);
    expect(r.demo).toBe(false);
  });
});
