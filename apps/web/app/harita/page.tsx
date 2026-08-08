import { composite, isBench, type RankedItem } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { Navbar } from "../../components/Navbar";
import { BandBar, BandLegend } from "../../components/BandBar";

export const dynamic = "force-dynamic";

interface Cell {
  count: number;
  pursue: number;
  watch: number;
  kill: number;
  bench: number;
}

function emptyCell(): Cell {
  return { count: 0, pursue: 0, watch: 0, kill: 0, bench: 0 };
}

function bucket(items: RankedItem[]): {
  grid: Map<string, Map<string, Cell>>; // sector -> market -> cell
  sectors: string[];
  markets: string[];
} {
  const grid = new Map<string, Map<string, Cell>>();
  const sectors = new Set<string>();
  const markets = new Set<string>();

  for (const item of items) {
    const sector = item.signal.sector ?? "bilinmiyor";
    const market = item.signal.market ?? "bilinmiyor";
    sectors.add(sector);
    markets.add(market);
    const comp = composite(item.analyses);

    if (!grid.has(sector)) grid.set(sector, new Map());
    const row = grid.get(sector)!;
    if (!row.has(market)) row.set(market, emptyCell());
    const cell = row.get(market)!;

    cell.count++;
    cell[comp.band]++;
    if (isBench(comp)) cell.bench++;
  }

  return {
    grid,
    sectors: [...sectors].sort((a, b) => a.localeCompare(b, "tr")),
    markets: [...markets].sort((a, b) => a.localeCompare(b, "tr")),
  };
}

export default async function HaritaPage() {
  const [{ items, demo }, me] = await Promise.all([loadItems(), getSession()]);
  const { grid, sectors, markets } = bucket(items);

  return (
    <div>
      <Navbar me={me} current="harita" />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Sektör Haritası</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {items.length} sinyal · sektör × pazar · bant dağılımı + bench yoğunluğu
            </p>
          </div>
          <BandLegend />
        </header>

        {demo && (
          <div className="mb-6 rounded-btn border border-strong bg-elevated px-4 py-3 text-sm text-brand">
            Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">Henüz analiz edilmiş sinyal yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-canvas p-2 text-left text-xs font-semibold text-ink-muted">
                    Sektör \ Pazar
                  </th>
                  {markets.map((m) => (
                    <th key={m} className="p-2 text-left text-xs font-semibold text-ink-muted">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectors.map((sector) => (
                  <tr key={sector}>
                    <th className="sticky left-0 bg-canvas p-2 text-left text-xs font-medium text-ink">
                      {sector}
                    </th>
                    {markets.map((market) => {
                      const cell = grid.get(sector)?.get(market);
                      if (!cell) return <td key={market} className="min-w-[140px] p-2" />;
                      return (
                        <td key={market} className="glass min-w-[140px] p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-bold">{cell.count}</span>
                            {cell.bench > 0 && (
                              <span className="chip text-[10px]">🏅 {cell.bench}</span>
                            )}
                          </div>
                          <BandBar
                            pursue={cell.pursue}
                            watch={cell.watch}
                            kill={cell.kill}
                            className="mt-2"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
