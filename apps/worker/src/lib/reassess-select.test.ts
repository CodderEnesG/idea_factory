import { describe, expect, it } from "vitest";
import { addTags, REASSESS_TAG, selectReassessIds, type AnalysisRow } from "./reassess-select.js";

const row = (signal_id: string, lens: string, fit: number, tags: unknown = []): AnalysisRow => ({
  signal_id,
  lens,
  fit,
  tags,
});

describe("selectReassessIds", () => {
  it("fit ≥ 50 olanları seçer, en yüksek fit önce", () => {
    const { todo } = selectReassessIds(
      [row("a", "arbitrage", 60), row("b", "arbitrage", 88), row("c", "arbitrage", 49)],
      ["arbitrage"],
    );
    expect(todo).toEqual(["b", "a"]);
  });

  it("hedef mercekte hepsi tag'liyse atlar ve done sayar", () => {
    const { todo, done } = selectReassessIds(
      [row("a", "arbitrage", 70, [REASSESS_TAG]), row("b", "arbitrage", 70, ["x"])],
      ["arbitrage"],
    );
    expect(todo).toEqual(["b"]);
    expect(done).toBe(1);
  });

  it("biri tag'siz kalan çok-mercekli sinyal yeniden işlenir", () => {
    const { todo } = selectReassessIds(
      [row("a", "arbitrage", 70, [REASSESS_TAG]), row("a", "white_space", 30)],
      ["arbitrage", "white_space"],
    );
    expect(todo).toEqual(["a"]);
  });

  it("özel tag verilirse önceki geçişin tag'i 'tamam' sayılmaz", () => {
    const rows = [row("a", "arbitrage", 70, [REASSESS_TAG])];
    expect(selectReassessIds(rows, ["arbitrage"]).todo).toEqual([]);
    expect(selectReassessIds(rows, ["arbitrage"], 50, "reassess:b2c").todo).toEqual(["a"]);
  });

  it("hedef dışı mercek seçime ve done kararına girmez", () => {
    const { todo } = selectReassessIds(
      [row("a", "arbitrage", 40), row("a", "white_space", 90)],
      ["arbitrage"],
    );
    expect(todo).toEqual([]);
  });
});

describe("addTags", () => {
  it("yinelemeden ekler, tag olmayanları düşürür", () => {
    expect(addTags(["x", 3, REASSESS_TAG], [REASSESS_TAG, "y"])).toEqual(["x", REASSESS_TAG, "y"]);
    expect(addTags(null, ["y"])).toEqual(["y"]);
  });
});
