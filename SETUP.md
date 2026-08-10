# Idea Factory — Kurulum & Çalıştırma

Tez-odaklı giriş & pazar istihbaratı platformu (v1 MVP). Sinyal içeri → şüpheci AI analist
tezine göre puanlar → kovala / izle / ele kuyruğu + digest dışarı.

Strateji/felsefe: `IDEA.md`, `PLAN.md`, `THESIS_AND_LENS.md`, `AI_ANALYST.md`,
`MARKET_KNOWLEDGE.md`, `BUSINESS_MODEL.md`.

## Mimari (monorepo, pnpm)

```
packages/core     Framework-bağımsız çekirdek (saf TS)
  signal.ts         Signal zod şeması
  thesis.config.ts  v1 tez (Türkiye arbitraj mandası)
  lenses.config.ts  Arbitraj merceği: şema + prompt + fit-bant
  analyst.ts        Anthropic çağrısı + zod + mantık guard'ları + retry
  guards.ts         Bant-aksiyon / güven-kapısı / atıfsız-olgu / boş-validation
  ranker.ts         Fit-bant sort + bant-içi tazelik tiebreak
  digest.ts         Markdown digest + "doğrulama bekleyenler"
  knowledge.ts      Bilgi Katmanı interface (v1 boş stub; gbrain faz 2)
  eval/             Golden few-shot + 20-vaka eval + harness
apps/worker       Ingestion + analiz (ayrı Node süreci)
  sources/          producthunt (RSS), tldr (RSS keşif + sayı-parse)
  ingest / analyze / digest / tick
apps/web          Next.js — landing + fırsat kuyruğu + decisions API
supabase/         migration (signals / analyses / decisions)
```

Design system: **Idea Factory Dark** — near-black canvas, teal marka (`#65DCD5`), karar üçlüsü
(kovala emerald / izle amber / ele rose), Satoshi(display)+Figtree(UI). Referans: Framer/Xtract.

## Kurulum

```bash
corepack enable pnpm      # Node 20+ bundled
pnpm install
cp .env.example .env      # key'leri doldur (.env.local da okunur, öncelikli)
```

`.env`:
- `ANALYSIS_PROVIDER` — `gemini` (MVP, varsayılan) | `anthropic` (sonra)
- `GEMINI_API_KEY`, `GEMINI_MODEL` (varsayılan `gemini-3.5-flash`, erişim yoksa `gemini-2.5-flash`) — MVP analist
- `ANTHROPIC_API_KEY`, `ANALYSIS_MODEL` — Claude sonrası için
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — worker
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — web
- `AUTH_SECRET` — ekip incelemesi login'i (boşsa auth kapalı = açık, lokal/demo). Public URL'de
  MUTLAKA set et: `openssl rand -hex 32`

> Analist sağlayıcı-bağımsız: MVP Gemini (ucuz, grounding kapalı), Claude tek env ile devreye girer.

Supabase: proje aç → SQL Editor'de migration'ları sırayla çalıştır:
`0001_init.sql` → `0002` → `0003` → `0004_rls.sql` → `0005_members_comments.sql` (ekip incelemesi:
members + comments; per-user karar indeksi) → `0006_admin.sql` (admin rolü) →
`0007_thesis_versions.sql` (editable tez, `/admin/tez`) → `0008_lenses.sql` (editable mercek,
`/admin/mercekler`) → `0009_debates.sql` (AI Yorumcusu tartışma transkriptleri).

### Ekip incelemesi (per-user auth + işbirlikçi kararlar + yorum)
İki kişi fikirlere kovala/izle/ele atar (birbirini ezmez, aynı sinyalde ayrı satır) + yorum yazar.
1. `AUTH_SECRET` set et (yukarı).
2. Üye ekle (parola scrypt hash'lenir, düz metin DB'ye girmez); `--admin` ile admin yetkisi verilir
   (tez/mercek düzenleme + AI Yorumcusu tetikleme):
   ```bash
   pnpm --filter @idea-factory/web add-member emir "Emir" guclu-parola --admin
   pnpm --filter @idea-factory/web add-member ali  "Ali"  guclu-parola
   ```
3. `/login` → giriş. Kartta kendi kararın düzenlenebilir, takım arkadaşınınki salt-okunur rozet.

> Kararlar+yorumlar per-user damgalanıp saklanır ve analiste geri besleniyor: aynı sektör/
> pazardaki geçmiş kararlar+yorumlar `İlgili geçmiş bağlam` olarak prompt'a girer
> (bkz. `apps/worker/src/lib/knowledge.ts`).

## Çalıştır

```bash
pnpm build                # tüm paketler
pnpm test                 # core birim testleri (18)

pnpm ingest               # kaynaklardan sinyal çek (PH + TLDR), dedup, DB'ye yaz
pnpm analyze              # analiz edilmemiş sinyalleri analistten geçir
pnpm --filter @idea-factory/worker digest   # markdown digest üret
pnpm --filter @idea-factory/worker tick     # ingest → analyze → digest (cron için)

# Geçmişe dönük doldurma (tek seferlik bakım — normal tick'i etkilemez):
BACKFILL_DRY=true pnpm --filter @idea-factory/worker backfill   # kaç aday var, LLM çağırmadan
BACKFILL_MAX=200 BACKFILL_CONCURRENCY=3 \
  pnpm --filter @idea-factory/worker backfill                   # BACKFILL_LENS varsayılan white_space
TRIAGE_SCAN_ALL=true TRIAGE_LIMIT=200 pnpm --filter @idea-factory/worker triage

pnpm eval                 # golden few-shot + 20-vaka eval (ağırlıklı skor + confusion)
pnpm web                  # kuyruk UI (localhost:3000; Supabase env yoksa demo modu)
```

> Not: port 3000 doluysa `pnpm --filter @idea-factory/web exec next dev -p 3100`.

### Neden backfill gerekiyor
`analyze.ts` ve `triage.ts` yalnız **en yeni pencereyi** tarar (`fetchShortlist`: `ANALYZE_LIMIT*20`
satır) — hızlı ve ucuz, ama bir mercek SONRADAN eklendiğinde eski sinyaller o pencereye bir daha
girmez. Beyaz-alan merceği eklendiğinde tam bu oldu (arbitraj 873 analiz / beyaz-alan 74 →
kompozit sıralama kartların %92'sinde tek-mercekliydi). `backfill-lens.ts` tabloyu sayfa sayfa
tarar, eksikleri `triage_score` sırasına göre işler, `BACKFILL_MAX` ile kademeli harcar ve
resumable'dır (tekrar çalıştır = kaldığı yerden). `TRIAGE_SCAN_ALL=true` triage için aynı şeyi
yapar. İkisi de tek seferlik bakım aracı — cron `tick`'ine girmez.

> Analiz başına dakikalar sürüyor (ağır JSON şeması + guard retry); `BACKFILL_CONCURRENCY`
> (varsayılan 3) paralel havuz açar. Vertex kotası dar — 5 paralelde `429 RESOURCE_EXHAUSTED`
> görülüyor; kota hatası alırsan 1-2'ye düşür. Başarısız sinyal satır yazmadığı için sonraki
> koşuda otomatik yeniden denenir.

## v1 kapsam notları
- Tek mercek (arbitraj), tek model (config `ANALYSIS_MODEL`, Opus). Kademeli model = faz 2.
- Dedup naif (url + content-hash). Entity-resolution = faz 2.
- Knowledge Layer: sözcüksel (tam eşleşme/kelime örtüşmesi) eşleştirme; semantik arama
  (embedding/gbrain) = faz 2.
- Ranker = fit-bant + tazelik; kompozit = faz 2.

## Deploy (M8)
- **Web**: Vercel (root `apps/web`, `transpilePackages` ile core). Env: `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`, **`AUTH_SECRET`** (public URL'de zorunlu).
- **Worker/cron**: ayrı süreç — GitHub Actions cron ya da küçük VM; `pnpm --filter worker tick`.
- **DB**: Supabase (prod projesi + migration).
- Sertleştirme: `/review` + `/cso`, SDK'yı en son sürüme bump (web_search/pause_turn tipleri).

## Faz 2 (sonra)
gbrain/RAG + memory · kademeli sonnet→opus · kompozit ranker · yeni mercekler (trend/beyaz-alan)
· B2B multi-tenant · canlı dashboard · debate modu.
