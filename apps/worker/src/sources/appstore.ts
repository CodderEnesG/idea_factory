import { SignalSchema, shortHash, type Signal } from "@idea-factory/core";
import type { Source } from "./types.js";

// Apple'ın açık iTunes RSS chart feed'i (anahtarsız). Mobil consumer'da "orada çalışıyor" kanıtı fon
// haberi değil hasılat sırası; kârlı uygulama basına düşmez, yalnız bu listede durur (Kanıtlı gelir
// listesi, 2026-09-27). Ölçüt: ABD top-grossing'de olup TR top-grossing'de OLMAYAN uygulamalar —
// Türkiye'de henüz karşılığı yok. `limit=200` istense de feed 100 giriş döndürüyor; genel liste tek
// başına ~37 uygulama veriyordu (34'ü oyun), o yüzden oyun dışı her kategorinin kendi listesi de çekilir
// (2026-09-27 ölçümü: 22 kategori × ilk 50 → ~630 uygulama). "TR'de yok" = TR'nin genel + kategori
// listelerinin hiçbirinde yok. Dev şirketler (ChatGPT, Hulu…) zenginleştirmede incumbent_feature olup düşer.
export const APPSTORE_SOURCE = "appstore_grossing";
const FEED = (country: string, genre?: number) =>
  `https://itunes.apple.com/${country}/rss/topgrossingapplications/limit=200${genre ? `/genre=${genre}` : ""}/json`;
const SUMMARY_CHARS = 400;
/** Kategori başına alınan ilk N — kategori #100'ü küçük gelir demek, sinyal değil gürültü. */
const PER_GENRE_LIMIT = 50;
// Oyunlar (6014) ve Developer Tools (6026) hariç tüm iTunes uygulama kategorileri.
export const GENRES = [
  6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012, 6013, 6015, 6016, 6017, 6018,
  6020, 6023, 6024, 6027,
];

export interface ItunesEntry {
  "im:name"?: { label?: string };
  "im:artist"?: { label?: string };
  summary?: { label?: string };
  id?: { attributes?: { "im:id"?: string } };
  link?: { attributes?: { rel?: string; href?: string } } | { attributes?: { rel?: string; href?: string } }[];
  category?: { attributes?: { label?: string } };
  "im:releaseDate"?: { label?: string };
}

export interface ChartApp {
  rank: number;
  appId: string;
  name: string;
  artist: string;
  category: string;
  url: string;
  summary: string;
  releasedAt: string | null;
  /** Sıranın geldiği liste: "overall" (genel hasılat) ya da kategori adı. */
  chart: string;
}

function appUrl(e: ItunesEntry): string | null {
  const links = Array.isArray(e.link) ? e.link : e.link ? [e.link] : [];
  const href = links.find((l) => l.attributes?.rel === "alternate")?.attributes?.href ?? links[0]?.attributes?.href;
  return href ? href.replace(/\?.*$/, "") : null;
}

/** Feed girişini sade kayda çevirir; kimliği ya da linki olmayan giriş atılır. Sıra 1'den başlar. */
export function parseChart(entries: ItunesEntry[], chart = "overall"): ChartApp[] {
  const out: ChartApp[] = [];
  entries.forEach((e, i) => {
    const appId = e.id?.attributes?.["im:id"];
    const name = e["im:name"]?.label?.trim();
    const url = appUrl(e);
    if (!appId || !name || !url) return;
    out.push({
      rank: i + 1,
      appId,
      name,
      artist: e["im:artist"]?.label?.trim() ?? "",
      category: e.category?.attributes?.label ?? "",
      url,
      summary: e.summary?.label?.trim() ?? "",
      releasedAt: e["im:releaseDate"]?.label ?? null,
      chart: chart === "overall" ? chart : (e.category?.attributes?.label ?? chart),
    });
  });
  return out;
}

/** ABD listelerinde olup TR listelerinin hiçbirinde olmayan, oyun dışı uygulamalar. Aynı uygulama birden
 *  çok listedeyse ilk görüldüğü (genel liste önce gelir) sıra kalır; liste sırası korunur. */
export function diffCharts(us: ChartApp[], tr: ChartApp[]): ChartApp[] {
  const inTr = new Set(tr.map((a) => a.appId));
  const seen = new Set<string>();
  return us.filter((a) => {
    if (a.category === "Games" || inTr.has(a.appId) || seen.has(a.appId)) return false;
    seen.add(a.appId);
    return true;
  });
}

export function chartAppToSignal(a: ChartApp, fetchedAt: string): Signal | null {
  const desc = a.summary.replace(/\s+/g, " ").slice(0, SUMMARY_CHARS);
  const summary = [
    a.chart === "overall" ? `ABD App Store hasılat #${a.rank}` : `ABD App Store ${a.chart} hasılat #${a.rank}`,
    "TR hasılat listesinde yok",
    a.category && `Kategori: ${a.category}`,
    desc,
  ]
    .filter(Boolean)
    .join(" · ");
  const parsed = SignalSchema.safeParse({
    id: shortHash(a.url),
    source: APPSTORE_SOURCE,
    type: "company",
    title: a.artist ? `${a.name} — ${a.artist}` : a.name,
    url: a.url,
    summary_raw: summary,
    market: null,
    sector: null,
    posted_at: a.releasedAt,
    fetched_at: fetchedAt,
    content_hash: shortHash(`${a.name}\n${summary}`),
    source_meta: {
      kind: "appstore",
      us_rank: a.rank,
      chart: a.chart,
      category: a.category,
      artist: a.artist,
      app_id: a.appId,
    },
  } satisfies Record<string, unknown>);
  if (parsed.success) return parsed.data;
  console.warn(`[appstore] şemaya uymadı, atlandı: ${a.url} — ${parsed.error.message}`);
  return null;
}

async function fetchChart(country: string, genre?: number): Promise<ChartApp[]> {
  const res = await fetch(FEED(country, genre), {
    headers: { "user-agent": "IdeaFactory/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`appstore ${country}${genre ? `/${genre}` : ""}: HTTP ${res.status}`);
  const data = (await res.json()) as { feed?: { entry?: ItunesEntry[] | ItunesEntry } };
  const entry = data.feed?.entry;
  return parseChart(Array.isArray(entry) ? entry : entry ? [entry] : [], genre ? String(genre) : "overall");
}

/** Genel + kategori listeleri; herhangi biri düşerse hata — eksik TR listesi yanlış "TR'de yok" yazar. */
async function fetchAllCharts(country: string, perGenre: number): Promise<ChartApp[]> {
  const overall = await fetchChart(country);
  const byGenre: ChartApp[][] = [];
  for (let i = 0; i < GENRES.length; i += 6) {
    const chunk = await Promise.all(GENRES.slice(i, i + 6).map((g) => fetchChart(country, g)));
    byGenre.push(...chunk.map((apps) => apps.slice(0, perGenre)));
  }
  return [overall, ...byGenre].flat();
}

export const appstoreGrossing: Source = {
  name: APPSTORE_SOURCE,
  async fetch(): Promise<Signal[]> {
    // TR'de kesme yok: TR'nin tam listelerinde görünen uygulama "TR'de yok" sayılmasın.
    const [us, tr] = await Promise.all([fetchAllCharts("us", PER_GENRE_LIMIT), fetchAllCharts("tr", Infinity)]);
    // TR listesi boş gelirse fark "ABD'nin tamamı" olur — yanlış "TR'de yok" iddiası yazma.
    if (tr.length === 0) throw new Error("appstore: TR listesi boş geldi");
    const now = new Date().toISOString();
    return diffCharts(us, tr)
      .map((a) => chartAppToSignal(a, now))
      .filter((s): s is Signal => s !== null);
  },
};
