import type { BaseAnalysis, RankedItem, Signal } from "@idea-factory/core";
import { serverDb } from "./supabase";
import { DEMO_ITEMS } from "./demo";

// PostgREST/Supabase yanıtı limit'siz .select()'te bile 1000 satırda SESSİZCE kesiyor
// (2026-08-21'de keşfedildi: 1247 analiz satırından 247'si hiçbir sayfada görünmüyordu, hata
// da yoktu). PAGE_SIZE bu tavana eşit; MAX_PAGES veri büyüdükçe kendiliğinden uyum sağlasın diye
// yalnız bir güvenlik tavanı (bugünkü ~1.2K satırın çok üstü).
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

// Kart görünümünde gerçekten okunan sinyal kolonları (bkz. build-card-view.ts + component'ler,
// 2026-08-21 grep'iyle doğrulandı). `type`/`summary_raw`/`content_hash`/`enriched_at` hiçbir
// yerde okunmuyor — `signals(*)` yerine bunları seçmek payload'ı ~%20 küçültüyor (enrichment
// JSONB'si zaten baskın kalem, o yüzden bu kadarla sınırlı).
// DİKKAT: `title` ve `url` kart başlığı/linki için ZORUNLU — önceki sürümde bunlar grep
// sonucunda görülüp listeye yazılırken atlanmıştı, kartlar boş başlık+href'siz link render
// ediyordu (2026-08-21, /design-review ile Panom'da yakalandı). Bu satırı değiştirirken
// PanomCard.tsx / build-card-view.ts'nin okuduğu TÜM alanları tekrar grep'le.
const SIGNAL_COLUMNS =
  "id, source, title, url, market, sector, posted_at, fetched_at, enrichment, watch_review_at";

export interface LoadItemsResult {
  items: RankedItem[];
  /** SADECE Supabase env yokken true — uydurma veri gösterildiğinin dürüst işareti. */
  demo: boolean;
  /** DB hatası mesajı; varsa UI hata durumu göstermeli, veri göstermemeli. */
  error: string | null;
}

/**
 * Tüm merceklerin analiz satırlarını çeker, sinyal başına `analyses` haritasında gruplar.
 * `/queue`, `/harita`, `/trend` paylaşır.
 *
 * ÜÇ AYRI DURUM (FAZ6_PLAN.md §Faz 3). Eskiden üçü de `DEMO_ITEMS` döndürüyordu ve banner
 * "Demo modu — Supabase env yok" diyordu:
 *   - env yok            -> demo veri (tek meşru kullanım)
 *   - DB hatası          -> HATA durumu; uydurma fırsatlar üstünde gerçek karar verilemez
 *   - sıfır satır, DB ok -> BOŞ durum; taze kurulmuş doğru yapılandırılmış bir DB
 *                           "env yok" diye suçlanmamalı
 */
export async function loadItems(): Promise<LoadItemsResult> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true, error: null };

  // Önce sayım (ucuz HEAD isteği), sonra sayfaları PARALEL çek — sıralı sayfalamanın toplam
  // gecikmeyi sayfa sayısıyla çarpmasını önler (bkz. commit mesajı: ölçüm notları).
  const { count, error: countError } = await db
    .from("analyses")
    .select("id", { count: "exact", head: true });
  if (countError) {
    console.error("[load-items] sayım hatası:", countError.message);
    return { items: [], demo: false, error: countError.message };
  }
  if (!count) return { items: [], demo: false, error: null }; // gerçekten boş

  const pageCount = Math.min(Math.ceil(count / PAGE_SIZE), MAX_PAGES);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      db
        .from("analyses")
        .select(`*, signals(${SIGNAL_COLUMNS})`)
        .range(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE - 1),
    ),
  );
  const pageErr = pages.find((p) => p.error)?.error;
  if (pageErr) {
    console.error("[load-items] sayfa hatası:", pageErr.message);
    return { items: [], demo: false, error: pageErr.message };
  }
  const rows = pages.flatMap((p) => (p.data ?? []) as Record<string, unknown>[]);
  if (rows.length === 0) return { items: [], demo: false, error: null };

  const bySignal = new Map<string, RankedItem>();
  for (const r of rows) {
    const { signals, ...rest } = r as Record<string, unknown> & { signals?: Signal };
    if (!signals) continue;
    const analysis = rest as unknown as BaseAnalysis;
    const item = bySignal.get(signals.id);
    if (item) item.analyses[analysis.lens] = analysis;
    else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
  }
  return { items: [...bySignal.values()], demo: false, error: null };
}

/* ── Hafif indeks + kimliğe göre ayrıntı (2026-09-24) ─────────────────────────────────────────
 *
 * `loadItems()` her istekte TÜM analiz satırlarını (gerekçe/risk metinleri + her satırda tekrarlanan
 * `enrichment` JSONB'si) çekiyor. 6.3K satırda tek yükleme 22 sn sürüp `statement timeout` veriyordu
 * (3 eşzamanlı sayfa — Next'in menü prefetch'i — hepsi düşüyordu; ölçüm: scratch/time-load*.mjs).
 * Gelen kutusu / Tüm sinyaller / Panom artık iki aşamalı çalışıyor:
 *   1. `loadIndexItems()`  — yalnız sıralamaya yetecek alanlar (fit, güven, mercek + sinyal başlığı).
 *                            ~3 sn / 2 MB, 45 sn süreç-içi önbellek + eşzamanlı çağrı tekilleştirme.
 *   2. `loadItemsByIds()`  — yalnız ekranda gösterilen 25-50 sinyalin tam analizi (~0.5 sn).
 * `/harita` ve `/trend` (tüm gerekçe metnine ihtiyaç duyan raporlar) `loadItems()`'i kullanmaya devam eder.
 */

const INDEX_TTL_MS = 45_000;
const HYDRATE_CHUNK = 40;
let indexCache: { at: number; value: Promise<LoadItemsResult> } | null = null;

async function pagedOrdered(
  table: "analyses" | "signals",
  columns: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const db = serverDb();
  if (!db) return { rows: [], error: "db yok" };
  const rows: Record<string, unknown>[] = [];
  // Sıralı (`id`) + ardışık sayfalar: sıralamasız offset sayfalama yük altında çakışan/atlanan satır ve
  // timeout üretiyordu; ardışık okuma toplam süreyi çok uzatmıyor (slim kolonlarla ~3 sn).
  for (let page = 0; page < MAX_PAGES * 2; page++) {
    const { data, error } = await db
      .from(table)
      .select(columns)
      .order("id")
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) return { rows: [], error: error.message };
    const batch = (data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { rows, error: null };
}

async function buildIndexItems(): Promise<LoadItemsResult> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true, error: null };

  const [an, sg] = await Promise.all([
    pagedOrdered("analyses", "signal_id, lens, fit, confidence"),
    pagedOrdered("signals", "id, source, title, market, sector, posted_at, fetched_at"),
  ]);
  if (an.error || sg.error) {
    const msg = an.error ?? sg.error ?? "bilinmeyen hata";
    console.error("[load-items] indeks hatası:", msg);
    return { items: [], demo: false, error: msg };
  }
  const signals = new Map(sg.rows.map((r) => [r["id"] as string, r]));
  const bySignal = new Map<string, RankedItem>();
  for (const r of an.rows) {
    const sid = r["signal_id"] as string;
    const sig = signals.get(sid);
    if (!sig) continue;
    const analysis = { lens: r["lens"], fit: r["fit"], confidence: r["confidence"] } as unknown as BaseAnalysis;
    const item = bySignal.get(sid);
    if (item) item.analyses[analysis.lens] = analysis;
    else
      bySignal.set(sid, {
        signal: { ...sig, url: "" } as unknown as Signal,
        analyses: { [analysis.lens]: analysis },
      });
  }
  return { items: [...bySignal.values()], demo: false, error: null };
}

/** Sıralama için hafif kalemler (tam gerekçe metni YOK). Başarısız sonuç önbelleğe alınmaz. */
export function loadIndexItems(): Promise<LoadItemsResult> {
  if (indexCache && Date.now() - indexCache.at < INDEX_TTL_MS) return indexCache.value;
  const value = buildIndexItems();
  const entry = { at: Date.now(), value };
  indexCache = entry;
  void value.then((r) => {
    if (r.error && indexCache === entry) indexCache = null;
  });
  return value;
}

/** Yalnız verilen sinyallerin TAM analizi (gerekçe, risk, enrichment). Sıra, `ids` sırasıdır. */
export async function loadItemsByIds(ids: string[]): Promise<RankedItem[]> {
  const db = serverDb();
  if (!db) return DEMO_ITEMS.filter((i) => ids.includes(i.signal.id));
  const bySignal = new Map<string, RankedItem>();
  for (let i = 0; i < ids.length; i += HYDRATE_CHUNK) {
    const chunk = ids.slice(i, i + HYDRATE_CHUNK);
    const { data, error } = await db
      .from("analyses")
      .select(`*, signals(${SIGNAL_COLUMNS})`)
      .in("signal_id", chunk);
    if (error) throw new Error(`ayrıntı yüklenemedi: ${error.message}`);
    for (const r of (data ?? []) as Record<string, unknown>[]) {
      const { signals, ...rest } = r as Record<string, unknown> & { signals?: Signal };
      if (!signals) continue;
      const analysis = rest as unknown as BaseAnalysis;
      const item = bySignal.get(signals.id);
      if (item) item.analyses[analysis.lens] = analysis;
      else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
    }
  }
  return ids.map((id) => bySignal.get(id)).filter((x): x is RankedItem => x !== undefined);
}
