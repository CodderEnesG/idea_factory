import { loadWorkspace, hydrate } from "../../lib/workspace";
import { loadRevenueMeta } from "../../lib/load-revenue-meta";
import { revenueMetricLine, sortByRevenue } from "../../lib/revenue-view";
import { InboxBoard } from "../../components/InboxBoard";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 50;

/**
 * Kanıtlı gelir (2026-09-27) — gelir/sıralama kanıtı taşıyan sinyaller (elle girilen doğrulanmış
 * gelir, App Store hasılat) Gelen kutusuna karışmaz; burada kaynak metriğine göre sıralı durur.
 * Liste küçük ve elle seçilmiş olduğundan sistemin "ele" dediği satırlar da gösterilir (nokta rengi
 * sistemin bandını söyler) — yalnız karar verilmişler düşer. Triage Gelen kutusuyla aynı bileşen.
 */
export default async function Kanitli() {
  const [ws, revenue] = await Promise.all([loadWorkspace(), loadRevenueMeta()]);

  const analyzed = ws.revenueEntries;
  const undecided = analyzed.filter((e) => e.mine === null && e.final === null);
  const sorted = sortByRevenue(undecided, revenue.metaById).slice(0, LIST_LIMIT);
  const cards = await hydrate(ws, sorted.map((e) => e.id));

  const metricById: Record<string, string> = {};
  for (const e of sorted) {
    const line = revenueMetricLine(revenue.metaById.get(e.id));
    if (line) metricById[e.id] = line;
  }

  // İndeks yalnız analizi olan sinyalleri taşır; kalanlar zenginleştirme/analiz bekliyor ya da
  // zenginleştirmede elendi (ör. geliştirici aracı).
  const pending = Math.max(0, revenue.metaById.size - analyzed.length);

  return (
    <InboxBoard
      items={cards}
      hiddenKilled={0}
      decidedCount={0}
      me={ws.me}
      demo={ws.demo}
      loadError={ws.loadError ?? revenue.error}
      current="kanitli"
      title="Kanıtlı gelir"
      metricById={metricById}
      note={
        [
          analyzed.length > undecided.length && `${analyzed.length - undecided.length} karar verildi`,
          pending > 0 && `${pending} sinyal henüz analiz edilmedi ya da zenginleştirmede elendi`,
        ]
          .filter(Boolean)
          .join(" · ") || null
      }
    />
  );
}
