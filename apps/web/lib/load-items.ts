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

/** Tüm merceklerin analiz satırlarını çeker, sinyal başına `analyses` haritasında gruplar.
 *  `/queue`, `/harita`, `/trend` paylaşır — Supabase env yoksa DEMO_ITEMS'a düşer. */
export async function loadItems(): Promise<{ items: RankedItem[]; demo: boolean }> {
  const db = serverDb();
  if (!db) return { items: DEMO_ITEMS, demo: true };

  // Önce sayım (ucuz HEAD isteği), sonra sayfaları PARALEL çek — sıralı sayfalamanın toplam
  // gecikmeyi sayfa sayısıyla çarpmasını önler (bkz. commit mesajı: ölçüm notları).
  const { count, error: countError } = await db
    .from("analyses")
    .select("id", { count: "exact", head: true });
  if (countError || !count) return { items: DEMO_ITEMS, demo: true };

  const pageCount = Math.min(Math.ceil(count / PAGE_SIZE), MAX_PAGES);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) =>
      db
        .from("analyses")
        .select(`*, signals(${SIGNAL_COLUMNS})`)
        .range(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE - 1),
    ),
  );
  if (pages.some((p) => p.error)) return { items: DEMO_ITEMS, demo: true };
  const rows = pages.flatMap((p) => (p.data ?? []) as Record<string, unknown>[]);
  if (rows.length === 0) return { items: DEMO_ITEMS, demo: true };

  const bySignal = new Map<string, RankedItem>();
  for (const r of rows) {
    const { signals, ...rest } = r as Record<string, unknown> & { signals?: Signal };
    if (!signals) continue;
    const analysis = rest as unknown as BaseAnalysis;
    const item = bySignal.get(signals.id);
    if (item) item.analyses[analysis.lens] = analysis;
    else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
  }
  return { items: [...bySignal.values()], demo: false };
}
