import Link from "next/link";
import { loadWorkspace, hydrate } from "../../lib/workspace";
import { loadRevenueMeta } from "../../lib/load-revenue-meta";
import { revenueMetricLine, sortByRevenue } from "../../lib/revenue-view";
import { canonicalSourceName } from "../../lib/source-health";
import { InboxBoard } from "../../components/InboxBoard";
import { PanomBoard } from "../../components/PanomBoard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const SOURCES = [
  { key: "", label: "Tümü" },
  { key: "manual_revenue", label: "TrustMRR" },
  { key: "appstore_grossing", label: "App Store" },
] as const;
const SORTS = [
  { key: "", label: "Uyum" },
  { key: "gelir", label: "Gelir sırası" },
] as const;

type Params = { kaynak?: string; sirala?: string; sayfa?: string; durum?: string };

/**
 * Kanıtlı gelir (2026-09-27) — gelir/sıralama kanıtı taşıyan sinyaller (elle girilen doğrulanmış
 * gelir, App Store hasılat) Gelen kutusuna karışmaz; burada ayrı listelenir. Liste elle seçilmiş
 * olduğundan sistemin "ele" dediği satırlar da gösterilir (nokta rengi sistemin bandını söyler) —
 * yalnız karar verilmişler düşer. Varsayılan sıra uyum: farklı App Store kategorilerinin "#1"leri
 * gelir sırasında yan yana gelip birbirinin yerine geçmez; gelir sırası ayrı seçenek.
 */
export default async function Kanitli({ searchParams }: { searchParams: Params }) {
  const [ws, revenue] = await Promise.all([loadWorkspace(), loadRevenueMeta()]);

  const kararlar = searchParams.durum === "kararlar";
  const kaynak = SOURCES.some((s) => s.key === searchParams.kaynak) ? searchParams.kaynak! : "";
  const sirala = searchParams.sirala === "gelir" ? "gelir" : "";

  const analyzed = ws.revenueEntries;
  // Kararlar = herhangi bir üyenin (ya da ekibin) karar verdiği satırlar — ortak görünüm.
  const decided = analyzed.filter((e) => e.decided !== null);
  const undecidedAll = analyzed.filter((e) => e.mine === null && e.final === null);
  const undecided = kaynak ? undecidedAll.filter((e) => canonicalSourceName(e.source) === kaynak) : undecidedAll;
  // `entries` zaten bant+güven+uyuma göre sıralı (loadWorkspace) — "uyum" o sırayı korur.
  const sorted = sirala === "gelir" ? sortByRevenue(undecided, revenue.metaById) : undecided;

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(searchParams.sayfa ?? "1", 10) || 1));
  const pageEntries = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cards = await hydrate(ws, pageEntries.map((e) => e.id));

  const metricById: Record<string, string> = {};
  for (const e of pageEntries) {
    const line = revenueMetricLine(revenue.metaById.get(e.id));
    if (line) metricById[e.id] = line;
  }

  // İndeks yalnız analizi olan sinyalleri taşır; kalanlar analiz bekliyor ya da zenginleştirmede
  // elendi (dev şirket duyurusu, geliştirici aracı).
  const pending = Math.max(0, revenue.metaById.size - analyzed.length);
  const countBy = (key: string) =>
    key ? undecidedAll.filter((e) => canonicalSourceName(e.source) === key).length : undecidedAll.length;

  const href = (p: Partial<Record<"kaynak" | "sirala" | "sayfa" | "durum", string>>) => {
    const q = new URLSearchParams();
    const d = p.durum ?? (kararlar ? "kararlar" : "");
    if (d) q.set("durum", d);
    const k = p.kaynak ?? kaynak;
    const s = p.sirala ?? sirala;
    const sy = p.sayfa ?? "";
    if (k) q.set("kaynak", k);
    if (s) q.set("sirala", s);
    if (sy && sy !== "1") q.set("sayfa", sy);
    const qs = q.toString();
    return qs ? `/kanitli?${qs}` : "/kanitli";
  };
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs transition ${
      active ? "bg-white/[0.1] text-ink" : "text-ink-secondary hover:bg-white/[0.05] hover:text-ink"
    }`;

  const tabs = (
    <div className="flex gap-1">
      <Link href={href({ durum: "", sayfa: "1" })} className={chip(!kararlar)}>
        Karar bekleyen <span className="font-mono text-[10px] text-ink-muted">{undecidedAll.length}</span>
      </Link>
      <Link href={href({ durum: "kararlar", sayfa: "1" })} className={chip(kararlar)}>
        Kararlar <span className="font-mono text-[10px] text-ink-muted">{decided.length}</span>
      </Link>
    </div>
  );

  if (kararlar) {
    const active = decided.filter((e) => e.decided !== "kill");
    const decidedCards = await hydrate(ws, active.map((e) => e.id));
    const killed = decided
      .filter((e) => e.decided === "kill")
      .map((e) => ({ id: e.id, title: e.title, source: e.source }));
    return (
      <PanomBoard
        cards={decidedCards}
        killed={killed}
        me={ws.me}
        meName={ws.meName}
        current="kanitli"
        title="Kanıtlı gelir · Kararlar"
        shared
        toolbar={<div className="mt-3">{tabs}</div>}
      />
    );
  }

  const toolbar = (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {tabs}
      <div className="flex flex-wrap gap-1">
        {SOURCES.map((s) => (
          <Link key={s.key} href={href({ kaynak: s.key, sayfa: "1" })} className={chip(kaynak === s.key)}>
            {s.label} <span className="font-mono text-[10px] text-ink-muted">{countBy(s.key)}</span>
          </Link>
        ))}
      </div>
      <div className="flex gap-1">
        {SORTS.map((s) => (
          <Link key={s.key} href={href({ sirala: s.key, sayfa: "1" })} className={chip(sirala === s.key)}>
            {s.label}
          </Link>
        ))}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-2 font-mono text-xs text-ink-muted">
          {page > 1 ? (
            <Link href={href({ sayfa: String(page - 1) })} className="text-brand hover:underline">
              ← önceki
            </Link>
          ) : (
            <span className="opacity-40">← önceki</span>
          )}
          <span>
            sayfa {page}/{pageCount}
          </span>
          {page < pageCount ? (
            <Link href={href({ sayfa: String(page + 1) })} className="text-brand hover:underline">
              sonraki →
            </Link>
          ) : (
            <span className="opacity-40">sonraki →</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <InboxBoard
      key={`${kaynak}-${sirala}-${page}`}
      items={cards}
      hiddenKilled={0}
      decidedCount={0}
      me={ws.me}
      demo={ws.demo}
      loadError={ws.loadError ?? revenue.error}
      current="kanitli"
      title="Kanıtlı gelir"
      metricById={metricById}
      total={undecided.length}
      toolbar={toolbar}
      note={
        [
          analyzed.length > undecidedAll.length && `${analyzed.length - undecidedAll.length} karar verildi`,
          pending > 0 && `${pending} sinyal analiz dışı (zenginleştirmede elendi ya da bekliyor)`,
        ]
          .filter(Boolean)
          .join(" · ") || null
      }
    />
  );
}
