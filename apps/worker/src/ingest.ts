import type { Signal } from "@idea-factory/core";
import { db } from "./db.js";
import { productHunt } from "./sources/producthunt.js";
import { tldr } from "./sources/tldr.js";
import { webrazzi } from "./sources/webrazzi.js";
import { techcrunch } from "./sources/techcrunch.js";
import { ycombinator } from "./sources/ycombinator.js";
import { webrazziFintech } from "./sources/webrazzi-fintech.js";
import { webrazziEticaret } from "./sources/webrazzi-eticaret.js";
import { techcrunchFintech } from "./sources/techcrunch-fintech.js";
import { webrazziYazilim } from "./sources/webrazzi-yazilim.js";
import { techcrunchEnterprise } from "./sources/techcrunch-enterprise.js";
import { techcrunchCommerce } from "./sources/techcrunch-commerce.js";
import { saastr } from "./sources/saastr.js";
import { euStartups } from "./sources/eu-startups.js";
import { sifted } from "./sources/sifted.js";
import { fintechtime } from "./sources/fintechtime.js";
import { finberg } from "./sources/finberg.js";
import type { Source } from "./sources/types.js";
import { dedupeBatch, quote } from "./lib/dedupe.js";
import { fetchAllSources } from "./lib/fetch-sources.js";
import { loadActiveIngestionSettings, shouldSkipForInterval } from "./lib/ingestion-settings-db.js";

const ALL_SOURCES: Source[] = [
  productHunt,
  tldr,
  webrazzi,
  techcrunch,
  ycombinator,
  webrazziFintech,
  webrazziEticaret,
  techcrunchFintech,
  webrazziYazilim,
  techcrunchEnterprise,
  techcrunchCommerce,
  saastr,
  euStartups,
  sifted,
  fintechtime,
  finberg,
];

// PostgREST sorgusu URL query string'e gömülür; 100+ sinyalin url+hash'i tek sorguda
// URL uzunluk limitini aşıp "fetch failed" veriyordu (4 kaynak sonrası görüldü) → parçala.
const EXISTING_CHUNK = 40;

/** DB'de zaten olanları (url veya content_hash) ele — idempotent. */
async function filterExisting(signals: Signal[]): Promise<Signal[]> {
  if (signals.length === 0) return [];
  const existingUrl = new Set<string>();
  const existingHash = new Set<string>();

  for (let i = 0; i < signals.length; i += EXISTING_CHUNK) {
    const chunk = signals.slice(i, i + EXISTING_CHUNK);
    const urls = chunk.map((s) => s.url);
    const hashes = chunk.map((s) => s.content_hash);

    const { data, error } = await db
      .from("signals")
      .select("url, content_hash")
      .or(`url.in.(${urls.map(quote).join(",")}),content_hash.in.(${hashes.map(quote).join(",")})`);
    if (error) throw new Error(`DB sorgu hatası: ${error.message}`);

    for (const r of data ?? []) {
      existingUrl.add(r.url);
      existingHash.add(r.content_hash);
    }
  }
  return signals.filter((s) => !existingUrl.has(s.url) && !existingHash.has(s.content_hash));
}

async function main(): Promise<void> {
  const settings = await loadActiveIngestionSettings();

  if (await shouldSkipForInterval(settings.min_interval_hours)) {
    console.log(
      `[ingest] asgari çekim aralığı (${settings.min_interval_hours} saat) henüz dolmadı — bu koşu atlandı`,
    );
    return;
  }

  const sources = ALL_SOURCES.filter((s) => settings.enabled_sources.includes(s.name));
  if (sources.length === 0) {
    console.warn("[ingest] uyarı: hiçbir kaynak aktif değil (toplama ayarları) — çekim atlandı");
    return;
  }

  console.log(
    `toplama ayarları: kaynak başı limit=${settings.per_source_limit || "sınırsız"}, paralellik=${settings.concurrency}, aktif kaynaklar=${sources.map((s) => s.name).join(", ")}`,
  );
  const { signals: collected, okSources, failedSources } = await fetchAllSources(sources, settings);

  // Toplu başarısızlık guard'ı (FAZ6_PLAN.md §Faz 1.3). Eskiden tüm kaynaklar patlasa bile
  // `collected` boş kalıp "yeni sinyal yok (idempotent)" yazılıyor ve süreç 0 ile çıkıyordu —
  // yani cron YEŞİL görünüyordu. Diğer beş aşamanın hepsinde bu guard vardı (enrich/triage/
  // analyze/debate-auto/backfill), yalnız ingest'te yoktu.
  if (okSources === 0) {
    throw new Error(
      `toplu başarısızlık: 0/${sources.length} kaynak çekilebildi (ağ/kaynak şeması kontrol et) — ${failedSources.join(", ")}`,
    );
  }
  // Kısmi hata UYARIDIR, throw değil: tek titrek bir RSS feed'i yüzünden cron kırmızıya
  // dönmemeli. Ama yarıdan fazlası düştüyse bu görünür olmalı.
  if (failedSources.length > sources.length / 2) {
    console.warn(
      `[ingest] uyarı: ${failedSources.length}/${sources.length} kaynak patladı — ${failedSources.join(", ")}`,
    );
  }

  const deduped = dedupeBatch(collected);
  const fresh = await filterExisting(deduped);
  console.log(`toplam ${collected.length} → batch-dedup ${deduped.length} → yeni ${fresh.length}`);

  if (fresh.length > 0) {
    const { error } = await db.from("signals").insert(fresh);
    if (error) throw new Error(`Insert hatası: ${error.message}`);
    console.log(`✓ ${fresh.length} yeni sinyal eklendi`);
  } else {
    console.log("yeni sinyal yok (idempotent)");
  }
}

main()
  .then(() => process.exit(0)) // diğer worker script'leriyle aynı desen — undici keep-alive bekletmesin
  .catch((e) => {
    console.error("ingest başarısız:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
