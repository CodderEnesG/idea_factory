"use client";

import { useMemo, useState } from "react";
import type { CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import type { SessionUser } from "../lib/session";
import { AppSidebar } from "./AppSidebar";
import { PanomCard } from "./PanomCard";
import { canonicalSourceName } from "../lib/source-health";
import { normalizeTag, distinct, distinctSources } from "../lib/facet-filters";
import { IconInbox, IconSearch } from "./icons";

interface Resolved extends CardView {
  effective: Decision;
  locked: boolean;
  lockedBy: string | null;
}

interface FinalOverride {
  decision: Decision;
  decidedBy: string;
}

const GROUPS: { d: Decision; label: string; dot: string; text: string }[] = [
  { d: "pursue", label: "Kovala", dot: "bg-pursue", text: "text-pursue" },
  { d: "watch", label: "İzle", dot: "bg-watch", text: "text-watch" },
  { d: "kill", label: "Ele", dot: "bg-kill", text: "text-kill" },
];

const PAGE_SIZE = 30;

/**
 * Panom (0013 yeniden tasarımı). Eski sürüm tek sayfada üç sonsuz dikey liste olarak
 * yaşıyordu (görsel/yapısal olarak Kuyruk'un kart diliyle uyumsuz, sürükle-bırak yok,
 * binlerce "ele" kartı aynı sayfada sonsuza kadar duruyordu — kullanıcı geri bildirimi
 * 2026-08-15). Bu sürüm gerçek 3-sütunlu kanban: kart sürüklenince KİŞİSEL karar yazılır
 * (`/api/decisions`), ayrı bir "Kilitle" düğmesi ekip kararını KESİNLEŞTİRİR
 * (`/api/decisions/final`, 0013) — sürüklemek bir kilidi asla bozmaz, önce açılmalı.
 * Ele varsayılan katlı (yalnız sayı); İzle "Bugün gözden geçir" (watchReviewAt geçmiş,
 * yalnız kilitli izlemeler için — final/route.ts +30g set eder) üstte, geri kalanı katlı.
 */
export function PanomBoard({ cards, me, meName }: { cards: CardView[]; me: SessionUser | null; meName: string }) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [market, setMarket] = useState("");
  const [source, setSource] = useState("");
  const [mineOverride, setMineOverride] = useState<Map<string, Decision>>(new Map());
  const [finalOverride, setFinalOverride] = useState<Map<string, FinalOverride | null>>(new Map());
  const [killOpen, setKillOpen] = useState(false);
  const [watchRestOpen, setWatchRestOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<Record<Decision, number>>({
    pursue: PAGE_SIZE,
    watch: PAGE_SIZE,
    kill: PAGE_SIZE,
  });
  const [dragOverCol, setDragOverCol] = useState<Decision | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resolved = useMemo<Resolved[]>(() => {
    const out: Resolved[] = [];
    for (const c of cards) {
      const mine = mineOverride.get(c.id) ?? c.mine;
      const finalOv = finalOverride.has(c.id)
        ? finalOverride.get(c.id)
        : c.finalDecision
          ? { decision: c.finalDecision, decidedBy: c.finalDecidedBy ?? "?" }
          : null;
      // Kilit açılıp kişisel karar da hiç yoksa (bu üye hiç oy vermemiş) kart Panom'da
      // durmasının anlamı kalmaz — Kuyruk'un kararsızlar listesine geri düşer.
      if (mine === null && !finalOv) continue;
      // resolveEffectiveBand (card-view.ts) ile aynı ilk iki basamak (final > kişisel) —
      // burada AI Yorumcusu/ham AI bandına hiç düşülmez, çünkü yukarıdaki filtre zaten
      // final veya mine'dan birinin var olmasını garanti eder (Panom = yalnız karar verilmiş
      // sinyaller). Kuyruk'ta karar yoksa AI/Yorumcu'ya düşen sinyaller burada hiç görünmez —
      // bu bilinçli: Panom "ne karar verdik", Kuyruk "sistem şu an ne düşünüyor" sorusuna cevap verir.
      const effective = finalOv?.decision ?? mine!;
      out.push({ ...c, mine, effective, locked: finalOv !== null, lockedBy: finalOv?.decidedBy ?? null });
    }
    return out;
  }, [cards, mineOverride, finalOverride]);

  const sectors = useMemo(() => distinct(resolved, (i) => i.sector), [resolved]);
  const markets = useMemo(() => distinct(resolved, (i) => i.market), [resolved]);
  const sources = useMemo(() => distinctSources(resolved), [resolved]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resolved.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (sector && (!i.sector || normalizeTag(i.sector).key !== sector)) return false;
      if (market && (!i.market || normalizeTag(i.market).key !== market)) return false;
      if (source && canonicalSourceName(i.source) !== source) return false;
      return true;
    });
  }, [resolved, search, sector, market, source]);

  const byBand = useMemo(() => {
    const map = new Map<Decision, Resolved[]>();
    for (const g of GROUPS) map.set(g.d, []);
    for (const c of filtered) map.get(c.effective)?.push(c);
    return map;
  }, [filtered]);

  const now = Date.now();
  const watchAll = byBand.get("watch") ?? [];
  const watchDue = watchAll.filter((c) => c.watchReviewAt && Date.parse(c.watchReviewAt) <= now);
  const watchRest = watchAll.filter((c) => !(c.watchReviewAt && Date.parse(c.watchReviewAt) <= now));

  const activeFilterCount = (sector ? 1 : 0) + (market ? 1 : 0) + (source ? 1 : 0);

  function clearFilters() {
    setSector("");
    setMarket("");
    setSource("");
  }

  async function decide(id: string, d: Decision) {
    const prev = mineOverride.get(id);
    setMineOverride((m) => new Map(m).set(id, d));
    setActionError(null);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: id, decision: d }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setMineOverride((m) => {
        const next = new Map(m);
        if (prev) next.set(id, prev);
        else next.delete(id);
        return next;
      });
      setActionError("Karar kaydedilemedi, bağlantını kontrol edip tekrar dene.");
    }
  }

  async function lock(id: string, d: Decision) {
    setFinalOverride((m) => new Map(m).set(id, { decision: d, decidedBy: meName }));
    setActionError(null);
    try {
      const res = await fetch("/api/decisions/final", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: id, decision: d }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setFinalOverride((m) => {
        const next = new Map(m);
        next.delete(id);
        return next;
      });
      setActionError("Kilitlenemedi, bağlantını kontrol edip tekrar dene.");
    }
  }

  async function unlock(id: string) {
    setFinalOverride((m) => new Map(m).set(id, null));
    setActionError(null);
    try {
      const res = await fetch("/api/decisions/final", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setFinalOverride((m) => {
        const next = new Map(m);
        next.delete(id);
        return next;
      });
      setActionError("Kilit açılamadı, bağlantını kontrol edip tekrar dene.");
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, target: Decision) {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const current = resolved.find((c) => c.id === id);
    if (!current || current.locked || current.effective === target) return;
    decide(id, target);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="panom" />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/[0.12] px-6 pt-16 pb-5 md:pt-5">
          <h1 className="font-display text-2xl font-bold">Panom</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {resolved.length} karar verilmiş sinyal · sürükle = kendi kararın, kilitle = ekip kararı
          </p>

          {resolved.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center rounded-btn border border-hair bg-elevated">
                <span className={`shrink-0 pl-2.5 ${search ? "text-ink" : "text-ink-muted"}`}>
                  <IconSearch className="h-3.5 w-3.5" />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearch("");
                  }}
                  placeholder="Ara…"
                  className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="chip bg-surface">
                <option value="">Sektör: Tümü</option>
                {sectors.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <select value={market} onChange={(e) => setMarket(e.target.value)} className="chip bg-surface">
                <option value="">Pazar: Tümü</option>
                {markets.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="chip bg-surface">
                <option value="">Kaynak: Tümü</option>
                {sources.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                  Temizle ({activeFilterCount})
                </button>
              )}
            </div>
          )}
          {actionError && <p className="mt-2 text-xs text-kill">{actionError}</p>}
        </header>

        {resolved.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">
            Henüz bir karar vermediniz. Kuyruk&apos;ta bir sinyale Kovala, İzle ya da Ele deyin —
            burada kendi klasörüne düşsün.
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">Bu filtrelerle eşleşen karar yok.</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col divide-y divide-white/[0.1] overflow-y-auto md:grid md:grid-cols-3 md:divide-x md:divide-y-0 md:overflow-hidden">
            {/* Kovala */}
            <KanbanColumn
              group={GROUPS[0]!}
              count={(byBand.get("pursue") ?? []).length}
              dragOver={dragOverCol === "pursue"}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverCol("pursue");
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, "pursue")}
            >
              <CardList
                items={byBand.get("pursue") ?? []}
                visible={visibleCount.pursue}
                onLoadMore={() => setVisibleCount((v) => ({ ...v, pursue: v.pursue + PAGE_SIZE }))}
                onLock={(id) => lock(id, "pursue")}
                onUnlock={unlock}
              />
            </KanbanColumn>

            {/* İzle */}
            <KanbanColumn
              group={GROUPS[1]!}
              count={watchAll.length}
              dragOver={dragOverCol === "watch"}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverCol("watch");
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, "watch")}
            >
              {watchDue.length > 0 && (
                <div className="mb-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-watch">
                    Bugün gözden geçir ({watchDue.length})
                  </div>
                  <div className="space-y-2.5">
                    {watchDue.map((item) => (
                      <PanomCard
                        key={item.id}
                        item={item}
                        effective={item.effective}
                        locked={item.locked}
                        lockedBy={item.lockedBy}
                        onLock={() => lock(item.id, "watch")}
                        onUnlock={() => unlock(item.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {watchRest.length > 0 && (
                <div>
                  {watchDue.length > 0 ? (
                    <button
                      onClick={() => setWatchRestOpen((v) => !v)}
                      className="mb-2 text-[11px] font-medium text-ink-muted hover:text-ink"
                    >
                      {watchRestOpen ? "Diğerlerini gizle ▴" : `Diğerleri (${watchRest.length}) ▾`}
                    </button>
                  ) : null}
                  {(watchDue.length === 0 || watchRestOpen) && (
                    <CardList
                      items={watchRest}
                      visible={visibleCount.watch}
                      onLoadMore={() => setVisibleCount((v) => ({ ...v, watch: v.watch + PAGE_SIZE }))}
                      onLock={(id) => lock(id, "watch")}
                      onUnlock={unlock}
                    />
                  )}
                </div>
              )}
            </KanbanColumn>

            {/* Ele */}
            <KanbanColumn
              group={GROUPS[2]!}
              count={(byBand.get("kill") ?? []).length}
              dragOver={dragOverCol === "kill"}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverCol("kill");
              }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, "kill")}
            >
              {!killOpen ? (
                // Katlı durum bilinçli (kullanıcı kararı: binlerce "ele" kartı sonsuza kadar
                // ekranda durmasın) — ama eski hali (ince bir buton + altında koca boş alan)
                // sayfa yüklenmemiş gibi görünüyordu. Bu, katlanmanın kendisinin kasıtlı bir
                // durum olduğunu gösteren bir yer tutucu.
                <button
                  onClick={() => setKillOpen(true)}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-white/[0.14] py-10 text-ink-muted transition hover:border-white/25 hover:text-ink"
                >
                  <IconInbox className="h-5 w-5" />
                  <span className="text-xs">
                    {(byBand.get("kill") ?? []).length} sinyal ele alındı — varsayılan katlı
                  </span>
                  <span className="chip mt-1">Göster ({(byBand.get("kill") ?? []).length})</span>
                </button>
              ) : (
                <>
                  <button onClick={() => setKillOpen(false)} className="mb-2 text-[11px] font-medium text-ink-muted hover:text-ink">
                    Gizle ▴
                  </button>
                  <CardList
                    items={byBand.get("kill") ?? []}
                    visible={visibleCount.kill}
                    onLoadMore={() => setVisibleCount((v) => ({ ...v, kill: v.kill + PAGE_SIZE }))}
                    onLock={(id) => lock(id, "kill")}
                    onUnlock={unlock}
                  />
                </>
              )}
            </KanbanColumn>
          </div>
        )}
      </main>
    </div>
  );
}

function KanbanColumn({
  group,
  count,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  group: { d: Decision; label: string; dot: string; text: string };
  count: number;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        // Alt bir karta/elemana girince de dragleave tetiklenir (DOM olay modeli) — gerçekten
        // sütunun dışına çıkılmadıysa yok say, aksi halde sürükleme sırasında vurgu titrer.
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        onDragLeave();
      }}
      onDrop={onDrop}
      className={`flex min-h-0 shrink-0 flex-col overflow-visible transition md:min-h-0 md:shrink md:overflow-hidden ${dragOver ? "bg-white/[0.04]" : ""}`}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 pb-3 pt-4">
        <span className={`h-2 w-2 rounded-full ${group.dot}`} />
        <h2 className={`font-display text-sm font-semibold ${group.text}`}>{group.label}</h2>
        <span className="font-mono text-xs text-ink-muted">({count})</span>
      </div>
      <div className="scroll-emphasis min-h-0 flex-1 space-y-2.5 overflow-visible px-4 pb-4 md:overflow-y-auto">{children}</div>
    </div>
  );
}

function CardList({
  items,
  visible,
  onLoadMore,
  onLock,
  onUnlock,
}: {
  items: Resolved[];
  visible: number;
  onLoadMore: () => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-ink-muted">Boş — buraya bir kart sürükle.</p>;
  }
  const shown = items.slice(0, visible);
  return (
    <div className="space-y-2.5">
      {shown.map((item) => (
        <PanomCard
          key={item.id}
          item={item}
          effective={item.effective}
          locked={item.locked}
          lockedBy={item.lockedBy}
          onLock={() => onLock(item.id)}
          onUnlock={() => onUnlock(item.id)}
        />
      ))}
      {items.length > shown.length && (
        <button
          onClick={onLoadMore}
          className="w-full rounded-btn border border-hair py-2 text-xs text-ink-muted transition hover:border-strong hover:text-ink"
        >
          Daha fazla yükle ({items.length - shown.length} tane daha)
        </button>
      )}
    </div>
  );
}
