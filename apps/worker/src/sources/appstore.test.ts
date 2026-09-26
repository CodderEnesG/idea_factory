import { afterEach, describe, it, expect, vi } from "vitest";
import { shortHash } from "@idea-factory/core";
import { appstoreGrossing, diffCharts, parseChart, type ItunesEntry } from "./appstore.js";

const entry = (id: string, name: string, category: string, artist = "Acme Inc."): ItunesEntry => ({
  "im:name": { label: name },
  "im:artist": { label: artist },
  summary: { label: `${name} açıklaması.\n\nİkinci paragraf.` },
  id: { attributes: { "im:id": id } },
  link: { attributes: { rel: "alternate", href: `https://apps.apple.com/us/app/x/id${id}?uo=2` } },
  category: { attributes: { label: category } },
  "im:releaseDate": { label: "2024-01-02T00:00:00-07:00" },
});

const US = [
  entry("1", "Big Game", "Games"),
  entry("2", "Flo Tracker", "Health & Fitness", "Flo Health"),
  entry("3", "Everywhere App", "Productivity"),
  entry("4", "LADDER", "Health & Fitness"),
];
const TR = [entry("3", "Everywhere App", "Productivity"), entry("9", "Yerel", "Lifestyle")];

describe("parseChart", () => {
  it("sırayı 1'den verir, linkteki sorgu parametresini atar", () => {
    const apps = parseChart(US);
    expect(apps.map((a) => a.rank)).toEqual([1, 2, 3, 4]);
    expect(apps[1]!.url).toBe("https://apps.apple.com/us/app/x/id2");
  });

  it("kimliksiz giriş atlanır ama sıra sayımında yer tutar", () => {
    const apps = parseChart([{ "im:name": { label: "Kimliksiz" } }, entry("5", "B", "Lifestyle")]);
    expect(apps).toHaveLength(1);
    expect(apps[0]!.rank).toBe(2);
  });
});

describe("diffCharts", () => {
  it("oyunları ve TR'de olanları atar, ABD sırasını korur", () => {
    const out = diffCharts(parseChart(US), parseChart(TR));
    expect(out.map((a) => [a.appId, a.rank])).toEqual([
      ["2", 2],
      ["4", 4],
    ]);
  });
});

describe("diffCharts — birden çok liste", () => {
  it("aynı uygulama iki listedeyse ilk görülen (genel liste) kalır; kategori listesi adını taşır", () => {
    const overall = parseChart([entry("2", "Flo", "Health & Fitness")]);
    const health = parseChart([entry("7", "Yeni", "Health & Fitness"), entry("2", "Flo", "Health & Fitness")], "6013");
    const out = diffCharts([...overall, ...health], []);
    expect(out.map((a) => [a.appId, a.rank, a.chart])).toEqual([
      ["2", 1, "overall"],
      ["7", 1, "Health & Fitness"],
    ]);
  });
});

describe("appstoreGrossing.fetch", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFeeds(tr: ItunesEntry[]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const entries = url.includes("/us/") ? US : tr;
        return new Response(JSON.stringify({ feed: { entry: entries } }), { status: 200 });
      }),
    );
  }

  it("fark listesini sinyale çevirir, sıra source_meta'da", async () => {
    stubFeeds(TR);
    const signals = await appstoreGrossing.fetch();
    expect(signals).toHaveLength(2);
    const flo = signals[0]!;
    expect(flo.source).toBe("appstore_grossing");
    expect(flo.type).toBe("company");
    expect(flo.title).toBe("Flo Tracker — Flo Health");
    expect(flo.id).toBe(shortHash("https://apps.apple.com/us/app/x/id2"));
    expect(flo.summary_raw).toBe(
      "ABD App Store hasılat #2 · TR hasılat listesinde yok · Kategori: Health & Fitness · " +
        "Flo Tracker açıklaması. İkinci paragraf.",
    );
    expect(flo.source_meta).toEqual({
      kind: "appstore",
      us_rank: 2,
      chart: "overall",
      category: "Health & Fitness",
      artist: "Flo Health",
      app_id: "2",
    });
  });

  it("TR listesi boşsa hata verir (yanlış 'TR'de yok' yazmaz)", async () => {
    stubFeeds([]);
    await expect(appstoreGrossing.fetch()).rejects.toThrow(/TR listesi boş/);
  });
});
