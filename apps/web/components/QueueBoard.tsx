"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveEffectiveBand, type CardView } from "../lib/card-view";
import type { Decision } from "./DecisionButtons";
import type { SessionUser } from "../lib/session";
import { QueueRow } from "./QueueRow";
import { DetailPanel } from "./DetailPanel";
import { AppSidebar } from "./AppSidebar";
import { BAND } from "./card-visuals";
import { canonicalSourceName } from "../lib/source-health";
import { normalizeTag, distinct, distinctSources } from "../lib/facet-filters";
import { IconAward, IconSearch, IconSliders, IconSparkle, IconZap } from "./icons";

type SortMode = "fit" | "recent" | "band" | "confidence" | "comments";
type ActivityFilter = "all" | "mine" | "friend" | "both";

const ACTIVITY_LABEL: Record<Exclude<ActivityFilter, "all">, string> = {
  mine: "Aktivite: Benim",
  friend: "Aktivite: Arkadaş",
  both: "Aktivite: İkisi de",
};

const PAGE_SIZE = 50;
const BANDS: CardView["band"][] = ["pursue", "watch", "kill"];

// Filtre/sıralama tercihleri kalıcı — sidebar'ın daralt/genişlet tercihiyle aynı desen
// (AppSidebar'daki COLLAPSE_KEY). Serbest metin arama kasıtlı hariç: sayfa açılışında sessizce
// dolu bir arama kutusuyla boş liste görmek kafa karıştırır.
const FILTERS_KEY = "idea-factory:queue-filters";

interface StoredFilters {
  sector: string;
  market: string;
  source: string;
  sort: SortMode;
  activity: ActivityFilter;
  benchOnly: boolean;
  undecidedOnly: boolean;
  bandFilter: CardView["band"][];
}

const BAND_RANK: Record<CardView["band"], number> = { pursue: 0, watch: 1, kill: 2 };
const CONFIDENCE_RANK: Record<CardView["confidence"], number> = { high: 0, med: 1, low: 2 };

function freshness(item: CardView): number {
  const t = Date.parse(item.postedAt ?? item.fetchedAt);
  return Number.isNaN(t) ? 0 : t;
}

function activityOf(item: CardView, meName: string): { mine: boolean; friend: boolean } {
  const mine = item.mine !== null || item.comments.some((c) => c.author === meName);
  const friend = item.others.length > 0 || item.comments.some((c) => c.author !== meName);
  return { mine, friend };
}

// Kuyruk son ziyaretten beri gelen fırsatları "yeni" işaretler — sunucu tarafında kullanıcı
// bazlı bir "son görülme" alanı yok, bu yüzden tarayıcıya özgü localStorage kullanılıyor
// (sidebar collapse/filtre tercihleriyle aynı desen).
const LAST_SEEN_KEY = "idea-factory:queue-last-seen";

/**
 * Kuyruk (Faz 5.5): kenar çubuğu (nav + arama/filtre + fırsat listesi, hepsi TEK sütun —
 * kullanıcı: "sol alan menü ve fırsatları birlikte barındıracak") + sağ detay paneli, tam
 * yükseklikte. Kuyruk = keşif/tarama (bu bileşen), Panom = zaten karar verilmiş olanı
 * yönetme — ayrım korunuyor. "Yalnız kararsızlar" anahtarı eski ayrı `/queue/tarama`
 * sayfasının (tek odak + oto-ilerleme) yerini bu ekranın içinde alıyor.
 */
export function QueueBoard({
  items,
  meName,
  me,
  demo,
}: {
  items: CardView[];
  meName: string;
  me: SessionUser | null;
  demo?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [market, setMarket] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<SortMode>("fit");
  const [activity, setActivity] = useState<ActivityFilter>("all");
  const [benchOnly, setBenchOnly] = useState(false);
  const [undecidedOnly, setUndecidedOnly] = useState(false);
  const [bandFilter, setBandFilter] = useState<Set<CardView["band"]>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localMine, setLocalMine] = useState<Map<string, Decision>>(new Map());
  const [localFinal, setLocalFinal] = useState<Map<string, { decision: Decision; decidedBy: string } | null>>(new Map());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [newOnly, setNewOnly] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const filtersWrapRef = useRef<HTMLDivElement>(null);

  // Bu ziyarette "yeni" sayılacak eşik — önceki ziyaretin son-görülme zamanı önce state'e
  // okunuyor, SONRA storage bugüne güncelleniyor (sıra önemli: tersi olsa hiçbir şey hiç
  // "yeni" görünmez).
  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_SEEN_KEY);
    setLastSeen(stored ? Number(stored) : Date.now());
    window.localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as Partial<StoredFilters>;
      if (stored.sector) setSector(stored.sector);
      if (stored.market) setMarket(stored.market);
      if (stored.source) setSource(stored.source);
      if (stored.sort) setSort(stored.sort);
      if (stored.activity) setActivity(stored.activity);
      if (stored.benchOnly) setBenchOnly(true);
      if (stored.undecidedOnly) setUndecidedOnly(true);
      if (stored.bandFilter?.length) setBandFilter(new Set(stored.bandFilter));
    } catch {
      // bozuk kayıt — yok say, varsayılanlarla devam
    }
  }, []);

  useEffect(() => {
    const stored: StoredFilters = {
      sector,
      market,
      source,
      sort,
      activity,
      benchOnly,
      undecidedOnly,
      bandFilter: [...bandFilter],
    };
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(stored));
  }, [sector, market, source, sort, activity, benchOnly, undecidedOnly, bandFilter]);

  useEffect(() => {
    if (!filtersOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (filtersWrapRef.current && !filtersWrapRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filtersOpen]);

  // Filtre/arama/sıralama değişince ilk sayfaya dön — kenar çubuğu artık kalıcı bir "Daha
  // fazla" menü bölümü taşıdığı için liste alanı küçüldü, yeni filtrede eskisinden kalan
  // yüzlerce satırı tek seferde DOM'a basmak yerine ilk PAGE_SIZE ile başlanıyor.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, sector, market, source, sort, activity, benchOnly, undecidedOnly, bandFilter]);

  function toggleBand(b: CardView["band"]) {
    setBandFilter((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  // Karar verilince tam sayfa yenilemeden panel/liste/sayaçlar güncellensin diye — sunucudan
  // gelen `items` sabit kalır, üstüne bu oturumdaki taze kararları/kilitleri bindiriyoruz.
  const resolved = useMemo(() => {
    if (localMine.size === 0 && localFinal.size === 0) return items;
    return items.map((i) => {
      const mine = localMine.has(i.id) ? localMine.get(i.id)! : i.mine;
      const finalOv = localFinal.has(i.id) ? localFinal.get(i.id) : undefined;
      if (!localMine.has(i.id) && finalOv === undefined) return i;
      const finalDecision = finalOv === undefined ? i.finalDecision : (finalOv?.decision ?? null);
      return {
        ...i,
        mine,
        finalDecision,
        finalDecidedBy: finalOv === undefined ? i.finalDecidedBy : (finalOv?.decidedBy ?? null),
        // Kararla birlikte anında güncellenmezse nokta rengi/sıralama sayfa yenilenene kadar
        // eski AI bandını gösterip dururdu (2026-08-19 bulgusu) — aynı hiyerarşiyi burada da uygula.
        effectiveBand: resolveEffectiveBand(i.band, mine, finalDecision, i.debates[0]?.final_verdict ?? null),
      };
    });
  }, [items, localMine, localFinal]);

  const sectors = useMemo(() => distinct(resolved, (i) => i.sector), [resolved]);
  const markets = useMemo(() => distinct(resolved, (i) => i.market), [resolved]);
  const sources = useMemo(() => distinctSources(resolved), [resolved]);

  const counts = useMemo(() => {
    let pursue = 0, watch = 0, kill = 0, bench = 0, undecided = 0;
    for (const i of resolved) {
      if (i.effectiveBand === "pursue") pursue++;
      else if (i.effectiveBand === "watch") watch++;
      else kill++;
      if (i.bench) bench++;
      if (i.mine === null) undecided++;
    }
    return { pursue, watch, kill, bench, undecided };
  }, [resolved]);

  const newIds = useMemo(() => {
    if (lastSeen === null) return new Set<string>();
    return new Set(resolved.filter((i) => freshness(i) > lastSeen).map((i) => i.id));
  }, [resolved, lastSeen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = resolved.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q)) return false;
      if (sector && (!i.sector || normalizeTag(i.sector).key !== sector)) return false;
      if (market && (!i.market || normalizeTag(i.market).key !== market)) return false;
      if (source && canonicalSourceName(i.source) !== source) return false;
      if (benchOnly && !i.bench) return false;
      if (newOnly && !newIds.has(i.id)) return false;
      if (undecidedOnly && (i.mine !== null || skipped.has(i.id))) return false;
      if (bandFilter.size > 0 && !bandFilter.has(i.effectiveBand)) return false;
      if (activity !== "all") {
        const a = activityOf(i, meName);
        if (activity === "mine" && !a.mine) return false;
        if (activity === "friend" && !a.friend) return false;
        if (activity === "both" && !(a.mine && a.friend)) return false;
      }
      return true;
    });
    if (sort === "recent") list = [...list].sort((a, b) => freshness(b) - freshness(a));
    else if (sort === "band")
      list = [...list].sort((a, b) => BAND_RANK[a.effectiveBand] - BAND_RANK[b.effectiveBand] || b.fit - a.fit);
    else if (sort === "confidence")
      list = [...list].sort((a, b) => CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence] || b.fit - a.fit);
    else if (sort === "comments") list = [...list].sort((a, b) => b.comments.length - a.comments.length || b.fit - a.fit);
    return list;
  }, [resolved, search, sector, market, source, benchOnly, newOnly, newIds, undecidedOnly, bandFilter, skipped, activity, sort, meName]);

  // Seçili öğe filtrelerin dışına düşerse (ör. "yalnız kararsızlar"da karar verilince)
  // listedeki ilk öğeye düş — bu aynı zamanda oto-ilerlemenin tamamı: ekstra state gerekmez.
  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

  // Kenar çubuğu artık "Daha fazla" menüsüyle kalıcı yer kapladığı için liste alanı küçüldü
  // — 900'e yakın satırı tek seferde DOM'a basmak yerine ilk PAGE_SIZE gösterilir, geri kalanı
  // "daha fazla yükle" ile katılır. `selected` her zaman `filtered`in tamamına bakar (yukarıda)
  // — seçili öğe sıralamada üstte olduğu için görünür sayfanın dışına düşmez.
  const visible = filtered.slice(0, visibleCount);

  const activeFilterCount =
    (sector ? 1 : 0) +
    (market ? 1 : 0) +
    (source ? 1 : 0) +
    (benchOnly ? 1 : 0) +
    (newOnly ? 1 : 0) +
    (activity !== "all" ? 1 : 0) +
    (undecidedOnly ? 1 : 0) +
    bandFilter.size;

  function clearFilters() {
    setSector("");
    setMarket("");
    setSource("");
    setBenchOnly(false);
    setNewOnly(false);
    setActivity("all");
    setUndecidedOnly(false);
    setBandFilter(new Set());
  }

  // Panel kapalıyken de hangi filtrelerin aktif olduğu görünsün + tek tek kaldırılabilsin
  // diye — eskiden yalnız panel içindeki "Temizle" hepsini birden sıfırlıyordu, tek bir
  // filtreyi kapatmak için paneli açıp select'i "Tümü"ye geri almak gerekiyordu.
  const activeChips: { key: string; label: string; onClear: () => void }[] = [
    ...(sector ? [{ key: "sector", label: sectors.find((s) => s.key === sector)?.label ?? sector, onClear: () => setSector("") }] : []),
    ...(market ? [{ key: "market", label: markets.find((m) => m.key === market)?.label ?? market, onClear: () => setMarket("") }] : []),
    ...(source ? [{ key: "source", label: sources.find((s) => s.key === source)?.label ?? source, onClear: () => setSource("") }] : []),
    ...(activity !== "all" ? [{ key: "activity", label: ACTIVITY_LABEL[activity], onClear: () => setActivity("all" as ActivityFilter) }] : []),
    ...(undecidedOnly ? [{ key: "undecided", label: "Kararsızlar", onClear: () => setUndecidedOnly(false) }] : []),
    ...(benchOnly ? [{ key: "bench", label: "Bench", onClear: () => setBenchOnly(false) }] : []),
    ...(newOnly ? [{ key: "new", label: "Yeni", onClear: () => setNewOnly(false) }] : []),
  ];

  const pillBtn = (active: boolean) =>
    `chip gap-1.5 transition ${active ? "border-strong text-ink" : "text-ink-muted hover:text-ink"}`;

  function toggleSelectedId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Toplu karar: seçili fırsatların hepsine tek istekte aynı kararı yaz. Kısmi başarısızlık
  // olursa (bkz. DecisionButtons'taki tekil-hata düzeltmesi) başarılı olanlar seçimden düşer,
  // başarısızlar seçili kalır — kullanıcı yalnız kalanları tekrar dener.
  async function bulkDecide(d: Decision) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ signal_id: id, decision: d }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return id;
      }),
    );
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    if (succeeded.length > 0) {
      setLocalMine((prev) => {
        const next = new Map(prev);
        for (const id of succeeded) next.set(id, d);
        return next;
      });
    }
    const succeededSet = new Set(succeeded);
    setSelectedIds((prev) => new Set([...prev].filter((id) => !succeededSet.has(id))));
    setBulkBusy(false);
    const failedCount = ids.length - succeeded.length;
    if (failedCount > 0) {
      setBulkError(`${failedCount} fırsat için kaydedilemedi, tekrar dene.`);
    } else {
      setSelectMode(false);
    }
  }

  return (
    // Tek kenar çubuğu: nav (AppSidebar) + Kuyruk'un kendi başlığı/filtreleri/listesi hepsi
    // aynı sütunda (kullanıcı: "sol alan menü ve fırsatları birlikte barındıracak") — ayrı
    // bir ikinci kenar çubuğu YOK. Sağ panel navbar'sız, baştan sona tam yükseklik.
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="queue">
        <div className="shrink-0 space-y-2 border-t border-white/[0.12] pt-3">
          <div ref={filtersWrapRef} className="relative">
            <div className="flex items-center rounded-btn border border-hair bg-elevated text-xs">
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
              <div className="h-4 w-px shrink-0 bg-white/[0.12]" />
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                title="Filtreler"
                aria-label="Filtreler"
                aria-expanded={filtersOpen}
                className={`flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 transition ${
                  filtersOpen || activeFilterCount > 0 ? "text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                <IconSliders className="h-3.5 w-3.5" />
                {activeFilterCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 font-mono text-[10px] font-bold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {filtersOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 space-y-3 rounded-card border border-hair bg-elevated p-3 text-xs shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink">Filtreler</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                      Tümünü temizle
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Kapsam</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={sector} onChange={(e) => setSector(e.target.value)} className="chip w-full bg-surface">
                      <option value="">Sektör: Tümü</option>
                      {sectors.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <select value={market} onChange={(e) => setMarket(e.target.value)} className="chip w-full bg-surface">
                      <option value="">Pazar: Tümü</option>
                      {markets.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select value={source} onChange={(e) => setSource(e.target.value)} className="chip w-full bg-surface">
                    <option value="">Kaynak: Tümü</option>
                    {sources.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Aktivite</div>
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as ActivityFilter)}
                    className="chip w-full bg-surface"
                  >
                    <option value="all">Aktivite: Hepsi</option>
                    <option value="mine">Aktivite: Benim</option>
                    <option value="friend">Aktivite: Arkadaş</option>
                    <option value="both">Aktivite: İkisi de</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Hızlı filtreler</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setUndecidedOnly((v) => !v)} className={`${pillBtn(undecidedOnly)} justify-center`}>
                      <IconZap className="h-3.5 w-3.5" /> Kararsızlar ({counts.undecided})
                    </button>
                    <button onClick={() => setBenchOnly((v) => !v)} className={`${pillBtn(benchOnly)} justify-center`}>
                      <IconAward className="h-3.5 w-3.5" /> Bench ({counts.bench})
                    </button>
                    <button onClick={() => setNewOnly((v) => !v)} className={`${pillBtn(newOnly)} justify-center`}>
                      <IconSparkle className="h-3.5 w-3.5" /> Yeni ({newIds.size})
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-hair pt-3">
                  <div className="px-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Sırala</div>
                  <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="chip w-full bg-surface">
                    <option value="fit">Fit</option>
                    <option value="recent">En yeni</option>
                    <option value="band">Bant</option>
                    <option value="confidence">Güven</option>
                    <option value="comments">En çok yorum</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onClear}
                  title={`${c.label} filtresini kaldır`}
                  className="chip gap-1 bg-elevated text-[11px] hover:border-strong hover:text-ink"
                >
                  {c.label}
                  <span className="text-ink-muted">×</span>
                </button>
              ))}
              <button onClick={clearFilters} className="text-[11px] text-ink-muted underline-offset-2 hover:text-ink hover:underline">
                Temizle
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {selectMode ? (
              <button
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                  setBulkError(null);
                }}
                className="text-[11px] text-ink-muted hover:text-ink"
              >
                Vazgeç
              </button>
            ) : (
              <span className="font-mono text-[11px] text-ink-muted">{filtered.length}</span>
            )}
            <div className="flex items-center gap-1">
              {!selectMode &&
                BANDS.map((b) => {
                  const active = bandFilter.has(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBand(b)}
                      aria-pressed={active}
                      title={`${BAND[b].label} ile filtrele (${counts[b]})`}
                      style={active ? { boxShadow: `inset 0 0 0 1px ${BAND[b].hex}` } : undefined}
                      className={`flex items-center gap-1 rounded-btn px-1.5 py-0.5 font-mono text-[11px] transition ${
                        active ? `bg-white/[0.06] ${BAND[b].text}` : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${BAND[b].dot}`} />
                      {counts[b]}
                    </button>
                  );
                })}
              <button
                type="button"
                onClick={() => setSelectMode((v) => !v)}
                title="Toplu seç"
                className={`rounded-btn px-1.5 py-0.5 font-mono text-[11px] transition ${
                  selectMode ? "bg-white/[0.06] text-ink" : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
                }`}
              >
                Seç
              </button>
            </div>
          </div>

          {selectMode && (
            <div className="flex items-center gap-1.5 rounded-btn border border-hair bg-elevated px-2 py-1.5">
              <span className="text-[11px] text-ink-muted">{selectedIds.size} seçili</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  disabled={bulkBusy || selectedIds.size === 0}
                  onClick={() => bulkDecide("pursue")}
                  className="chip disabled:opacity-40 hover:border-pursue hover:text-pursue"
                >
                  Kovala
                </button>
                <button
                  disabled={bulkBusy || selectedIds.size === 0}
                  onClick={() => bulkDecide("watch")}
                  className="chip disabled:opacity-40 hover:border-watch hover:text-watch"
                >
                  İzle
                </button>
                <button
                  disabled={bulkBusy || selectedIds.size === 0}
                  onClick={() => bulkDecide("kill")}
                  className="chip disabled:opacity-40 hover:border-kill hover:text-kill"
                >
                  Ele
                </button>
              </div>
            </div>
          )}
          {bulkError && <p className="text-[11px] text-kill">{bulkError}</p>}
        </div>

        <div className="scroll-emphasis min-h-0 flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-ink-muted">Bu filtrelerle eşleşen fırsat yok.</p>
          )}
          {visible.map((item) => (
            <QueueRow
              key={item.id}
              item={item}
              selected={selectMode ? selectedIds.has(item.id) : item.id === selected?.id}
              onSelect={() => (selectMode ? toggleSelectedId(item.id) : setSelectedId(item.id))}
              selectMode={selectMode}
              isNew={newIds.has(item.id)}
            />
          ))}
          {filtered.length > visible.length && (
            <button
              onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              className="mx-2 my-2 w-[calc(100%-1rem)] rounded-btn border border-hair py-2 text-xs text-ink-muted transition hover:border-strong hover:text-ink"
            >
              Daha fazla yükle ({filtered.length - visible.length} tane daha)
            </button>
          )}
        </div>
      </AppSidebar>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {demo && (
          <div className="shrink-0 border-b border-strong bg-elevated py-2 pl-14 pr-5 text-sm text-brand md:pl-5">
            Demo modu — Supabase env yok. Gerçek analizler için <code>.env</code>&apos;e key ekle.
          </div>
        )}
        <div className="min-h-0 flex-1">
          {selected ? (
            <DetailPanel
              item={selected}
              meName={meName}
              onDecided={(d) => setLocalMine((prev) => new Map(prev).set(selected.id, d))}
              onFinalized={(f) => setLocalFinal((prev) => new Map(prev).set(selected.id, f))}
              onSkip={
                undecidedOnly
                  ? () => setSkipped((prev) => new Set(prev).add(selected.id))
                  : undefined
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-muted">
              Soldan bir fırsat seç.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
