import { loadWorkspace, hydrate } from "../../lib/workspace";
import { canonicalSourceName } from "../../lib/source-health";
import { SignalsExplorer, type ExplorerFilters, type ExplorerRow } from "../../components/SignalsExplorer";
import type { Band } from "../../lib/card-view";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;
const BANDS: Band[] = ["pursue", "watch", "kill"];

type Params = { q?: string; band?: string; karar?: string; kaynak?: string; sayfa?: string; id?: string };

/** Tüm sinyaller: süzme/sayfalama sunucuda, yalnız görünen sayfanın kartları çekilir. */
export default async function Queue({ searchParams }: { searchParams: Params }) {
  const ws = await loadWorkspace();

  const filters: ExplorerFilters = {
    q: (searchParams.q ?? "").trim().slice(0, 100),
    band: BANDS.includes(searchParams.band as Band) ? (searchParams.band as Band) : "",
    karar: searchParams.karar === "kararsiz" || searchParams.karar === "kararli" ? searchParams.karar : "",
    kaynak: (searchParams.kaynak ?? "").slice(0, 60),
  };

  const sourceCounts = new Map<string, number>();
  for (const e of ws.entries) {
    const k = canonicalSourceName(e.source);
    sourceCounts.set(k, (sourceCounts.get(k) ?? 0) + 1);
  }
  const sources = [...sourceCounts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);

  // Bant sayaçları band süzgeci HARİÇ diğer süzgeçleri yansıtır ki sekmeler "buraya basarsan ne kadar" desin.
  const q = filters.q.toLocaleLowerCase("tr");
  const base = ws.entries.filter(
    (e) =>
      (!q || e.title.toLocaleLowerCase("tr").includes(q)) &&
      (!filters.kaynak || canonicalSourceName(e.source) === filters.kaynak) &&
      (filters.karar === "" || (filters.karar === "kararsiz" ? e.decided === null : e.decided !== null)),
  );
  const counts: Record<Band, number> = { pursue: 0, watch: 0, kill: 0 };
  for (const e of base) counts[e.gatedBand]++;
  const list = filters.band ? base.filter((e) => e.gatedBand === filters.band) : base;

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(searchParams.sayfa ?? "1", 10) || 1));
  const pageEntries = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // `?id=` (Gelen kutusu'ndan derin bağlantı): sayfada yoksa da açılsın.
  const wantedId = searchParams.id ?? null;
  // Kanıtlı gelir satırları listede yok ama "Tam analiz" derin bağlantısı onları da açar.
  const wanted = wantedId ? [...ws.entries, ...ws.revenueEntries].find((e) => e.id === wantedId) : undefined;
  const rowEntries = wanted && !pageEntries.some((e) => e.id === wanted.id) ? [wanted, ...pageEntries] : pageEntries;

  const cardList = await hydrate(
    ws,
    rowEntries.map((e) => e.id),
  );
  const cards = Object.fromEntries(cardList.map((c) => [c.id, c]));
  const rows: ExplorerRow[] = rowEntries.map((e) => ({
    id: e.id,
    title: e.title,
    source: e.source,
    sector: e.sector,
    fit: e.fit,
    gatedBand: e.gatedBand,
    decided: e.decided,
  }));

  return (
    <SignalsExplorer
      rows={rows}
      cards={cards}
      total={list.length}
      page={page}
      pageCount={pageCount}
      counts={counts}
      sources={sources}
      filters={filters}
      initialId={wanted?.id ?? null}
      me={ws.me}
      meName={ws.meName}
      demo={ws.demo}
      loadError={ws.loadError}
    />
  );
}
