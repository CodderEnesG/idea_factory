import { describe, it, expect } from "vitest";
import { fetchAll, PAGE } from "./fetch-all.js";

/** `total` satırlık sahte tablo; `range` gibi [from, to] dilimini döner. */
function fakeTable(total: number) {
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    const data = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
    return { data, error: null };
  };
  return { page, calls };
}

describe("fetchAll", () => {
  it("tavanı aşan tabloyu sayfa sayfa eksiksiz çeker", async () => {
    const { page, calls } = fakeTable(PAGE * 2 + 37);
    const rows = await fetchAll(page, "x");
    expect(rows).toHaveLength(PAGE * 2 + 37);
    expect(rows.at(-1)).toBe(PAGE * 2 + 36);
    expect(calls).toEqual([
      [0, PAGE - 1],
      [PAGE, PAGE * 2 - 1],
      [PAGE * 2, PAGE * 3 - 1],
    ]);
  });

  it("tam sayfa katında biterse boş sayfayla durur", async () => {
    const { page, calls } = fakeTable(PAGE);
    expect(await fetchAll(page, "x")).toHaveLength(PAGE);
    expect(calls).toHaveLength(2);
  });

  it("boş tablo ve null data boş dizi döner", async () => {
    expect(await fetchAll(fakeTable(0).page, "x")).toEqual([]);
    expect(await fetchAll(async () => ({ data: null, error: null }), "x")).toEqual([]);
  });

  it("sayfa hatasını önekle fırlatır (sessiz eksik veri yok)", async () => {
    const page = async () => ({ data: null, error: { message: "boom" } });
    await expect(fetchAll(page, "analyses sorgu hatası")).rejects.toThrow("analyses sorgu hatası: boom");
  });
});
