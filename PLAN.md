# Plan: Idea Factory — MVP + Mimari

> **Doküman haritası / otorite sırası.** Bu plan MVP + mimarinin kaynağıdır. Strateji kararları
> ayrı, daha güncel dokümanlarda:
> - **İş modeli** → `BUSINESS_MODEL.md` (v2; aşağıdaki §İş Modeli'nin yerini alır — burada özet).
> - **Analist personası** → `AI_ANALYST.md` (karar fonksiyonu, 3 katman, debate modu).
> - **Pazar bilgisi / "eğitme"** → `MARKET_KNOWLEDGE.md` (fine-tune değil grounding; 5 katman).
> - **Somut ilk tez + arbitraj merceği** → `THESIS_AND_LENS.md` (Türkiye/MENA değerleri + soru çerçevesi).
>
> Konumlanma kararı: **global, tez-bağımsız platform**; Türkiye/arbitraj = ilk tez/mercek, marka değil.

## Bağlam
Bir girişimci networkü (kurucu + arkadaşlar) için, startup/pazar sinyallerini sürekli toplayan, bunları **çok-mercekli (multi-lens), tez-odaklı yapay zeka analistlerinden** geçiren, **sıralı fırsat kuyruğu** üreten **ve aynı zamanda büyüyen, sorgulanabilir bir ekosistem bilgi tabanı** kuran bir sistem. Arbitraj (ABD/yurt dışı ürün → Türkiye'ye uyarlama) **ilk ve en keskin mercek** — ama tek mercek değil; yapı zamanla bambaşka çıktılara (trend raporu, sektör haritası, araştırma ürünü) evrilebilecek şekilde açık tasarlanır.

gstack zaten kuruldu (`~/.claude/skills/gstack`); Bun yalnızca gstack'in kendi araçları için yüklendi — **projenin kendisi Bun kullanmayacak, Node + React (Next.js) üzerinde olacak.**

Office-hours yeniden çerçeveleme (planı şekillendiren kararlar):
- Darboğaz fikir üretmek değil, **kanaat + doğrulama** (conviction + validation). Çıktı fikir saçmaz; sıralar / eler.
- **Tek mercek yerine çok mercek.** Arbitraj farklılaştırıcı ilk merceğimiz; ama analiz katmanı **eklenebilir mercekler** (trend, beyaz-alan, teknik yenilik, zamanlama…) alacak şekilde kurulur. Çıktı katmanı da decoupled → sistem zamanla başka bir ürüne dönüşebilir.
- **Bilgi birikimi birinci sınıf hedef.** Her sinyal + analiz, kalıcı bir **Bilgi Katmanı**na yazılır; network ekosistem hakkında soru sorabilir, bilgi compound eder. (İlk fikirdeki "bize ekosistem hakkında çok bilgi sağlayacak" kısmı.)
- **LinkedIn/Twitter veri çekimi kırılgan** (anti-scrape, ToS) → faz 2'ye ertelendi. v1 = ulaşılabilir kaynaklar.
- **Persona bir karar fonksiyonu olmalı** (sermaye aralığı, hedef pazarlar, yetkinlikler, risk iştahı) — havada laf değil.

Kullanıcıyla netleşen kararlar:
- Önce **dahili araç**; ileride **B2B** (muhtemelen sektör-dikey).
- Wedge = (arbitraj + diğer mercekler) keşfi **+** startup/fonlama takibi **+** bilgi tabanı, birleşik.
- MVP çıktısı = sıralı fırsat kuyruğu + periyodik özet (digest) + sorgulanabilir bilgi tabanı; canlı dashboard faz 2.
- Kaynaklar: ulaşılabilir-önce (YC, ProductHunt, bültenler/RSS, ücretsiz fonlama feed'leri).
- **Frontend React/Next.js**; **Figma tasarımı paylaşılacak** → UI oradan türetilecek. Genel/modüler, taşınabilir mimari (tek projeye aşırı bağlı değil).

---

## İş Modeli

> **Bu bölüm özetdir; otorite `BUSINESS_MODEL.md` (v2).** Orada: dürüst CEO-review, ICP
> önceliklendirme, North Star metriği, değere-çapalı fiyatlandırma, sağ-boyutlanmış moat,
> rekabet haritası ve ticari doğrulama planı.

### Değer Önerisi
"Sinyal içeri → çok-mercekli analiz + sıralı fırsatlar **+ büyüyen bilgi tabanı** dışarı." Network için üç şey üretir: (1) **hız** — literatürü tek tek takip etme yükünü kaldırır, (2) **kanaat** — her fırsatı tez'e göre puanlar, neyin emeğe değdiğini söyler, (3) **bilgi birikimi** — zamanla compound eden, sorgulanabilir bir ekosistem hafızası (kim, ne, hangi pazar, hangi trend).

### Faz 1 — Dahili Araç (şimdi)
- **Değer**: Network'ün daha çok ve daha iyi girişim çıkarması; karar hızının artması.
- **Maliyet**: geliştirme süresi + LLM API + hosting (düşük). Crunchbase gibi pahalı abonelikler yok.
- **Sessizce büyüyen moat**: tescilli **tez konfigürasyonu**, küratörlü **kaynak/scraper kütüphanesi**, ve **karar-geri besleme verisi** (her "kovala/ele" gelecekteki sıralamayı iyileştirir).

### Faz 2 — B2B Ürün (sonra)
- **Segmentler**: diğer kurucu networkleri, melek yatırımcı grupları, hızlandırıcılar, kurumsal inovasyon ekipleri, VC scout'lar.
- **Sektör-dikey paketler**: her dikey için hazır tez şablonu + kaynak seti (ör. fintech-arbitraj, e-ticaret-arbitraj).
- **Fiyatlandırma seçenekleri**:
  - Workspace başına aylık abonelik (örn. 3 kademe: Solo / Team / Network).
  - Kullanım üzeri (analiz edilen sinyal / derin-analiz sayısı) — LLM maliyetini fiyata bağlar.
- **GTM**: Faz 1'de kendi başarılı çıkışlarımız vaka çalışması; network-of-networks ile yayılım.

### Birim Ekonomisi (kaba taslak)
- Sinyal başına maliyet ≈ bulk skor (Sonnet, ucuz) + yalnız kısa listeye derin analiz (Opus). Dedup + filtre, analiz öncesi hacmi düşürür.
- Hedef: bir kullanıcının aylık LLM maliyeti, abonelik fiyatının küçük bir yüzdesi (yüksek brüt marj).

### Savunulabilirlik (Moat)
1. **Veri ağ etkisi** — kararlar biriktikçe sıralama kişiselleşir ve isabet artar.
2. **Kaynak kütüphanesi** — `skillify` ile kalıcılaşan scraper'lar; rakibin sıfırdan kurması zaman alır.
3. **Tez + mercek IP'si** — sektör-dikey tez şablonları ve özel analiz mercekleri.
4. **Bilgi tabanı** — yıllar süren kümülatif ekosistem hafızası; tek başına bir varlık/ürün (araştırma katmanı olarak da satılabilir).

---

## MVP Kapsamı (ne çıkacak)
Tek-kiracılı pipeline: **Topla → Normalize/Dedup → Çok-mercekli Analiz → Sırala → Sun (kuyruk + digest) → Bilgi Katmanına yaz**.
- 3–5 ulaşılabilir kaynak bağlı (YC launches, ProductHunt, 1–2 bülten/RSS, 1 ücretsiz fonlama feed'i).
- **Mercek kayıt defteri** — v1'de **arbitraj** merceği aktif; eklenebilir yapı (trend/beyaz-alan/teknik-yenilik sonradan tek dosyayla eklenir).
- Tek **tez konfigürasyonu** (Türkiye/MENA), versiyonlu.
- AI analist her sinyali aktif merceklerle puanlar: uyum skoru + gerekçe + uyarlama notları + riskler + önerilen aksiyon.
- React kuyruk arayüzü: kovala/izle/ele; kararlar kalıcı (geri-besleme tohumu).
- Haftalık markdown/HTML digest (en iyi N).
- **Bilgi Katmanı**: her sinyal+analiz embedding'lenip kalıcı, sorgulanabilir tabana yazılır; network basit bir arama/soru arayüzünden ekosistemi sorgular.

---

## Mimari

### Veri Akışı
```
Kaynaklar ─▶ Ingestion Worker ─▶ Normalize+Dedup ─▶ DB ──────────────┐
                                                      │              │
                  Tez + Mercek Kayıt Defteri ─▶ AI Analist           │
                  (v1: tek model=Opus, arbitraj merceği)             │
                                                      │              ▼
                                        Ranker (v1: fit+tazelik) Bilgi Katmanı
                                                      │  (canlı: lexical eşleştirme · pgvector ertelendi)
                              ┌───────────────────────┤              ▲
                        React Kuyruk UI         Digest üretici       │
                       (kovala/izle/ele)      (markdown/HTML/PDF)     │
                              │                                       │
                        decisions ─▶ geri besleme ─▶ Ranker ağırlıkları + Bilgi Katmanı
```

### `Signal` şeması (kaynaklar arası ortak)
`id, source, type(launch|funding|company), title, url(unique), summary_raw, market, sector, posted_at, fetched_at`

### Bileşenler (her biri ayrı modül)
1. **Kaynak kayıt defteri** — `sources.config.ts`: `{name, kind: rss|api|scrape, url, parser, cadence}`. Yeni kaynak = tek satır.
2. **Ingestion worker'ları** — kind'a göre çekim. Feed/API olmayan siteler için önce gstack `/browse` ile **geliştirme sırasında** sayfa incelenir (JS-render mi gerekiyor, altta kullanılabilir bir JSON uç nokta var mı — YC launches örneğinde meğer düz `fetch()` yetiyormuş, `Content-Type: application/json` dönüyor); ortaya çıkan çekim kodu **runtime'da gstack'e bağımlı olmadan** plain `fetch`/`node-html-parser` ile yazılır (worker CI'da/lokal koşarken gstack kurulu olmayabilir). Gerçekten headless tarayıcı gerektiren bir site çıkarsa `/scrape`+`skillify` deseni değerlendirilir, henüz gerekmedi.
3. **Depolama + dedup** — **Postgres (Supabase)**; `url`/içerik-hash üzerinde unique index. **v1 dedup naiftir**: aynı şirket farklı kaynaktan mükerrer görünebilir — bu kabul edilir (entity-resolution faz 2 problemi). Mükerrer içerik v1'de **bilinçli stres testi**: aynı sinyale iki farklı metinden aynı aksiyon çıkıyor mu — eval'daki mükerrer-çift tutarlılık kontrolüyle ölçülür (`THESIS_AND_LENS.md §3b`). Supabase seçildi çünkü: hosted, B2B için auth hazır, ileride `pgvector` ile semantik dedup/arama. (Alternatif: lokal başlamak istersen SQLite, sonra göç.)
4. **Tez/persona konfig** — `thesis.config.ts`: `{capital_range, target_markets, sectors, capabilities, risk_appetite, anti_patterns}`, versiyonlu. Analistin system prompt'unun ortak zemini.
5. **Mercek kayıt defteri** — `lenses.config.ts`: her mercek `{id, name, prompt_template, output_schema, weight}`. v1: `arbitrage`. Yeni mercek = tek giriş (trend, white-space, tech-novelty, timing…). Bu, "zamanla bambaşka çıktı" hedefinin teknik karşılığı.
6. **AI analist** — **sağlayıcı-bağımsız** (`AnalystProvider` interface): **MVP = Gemini** (`@google/genai`, ucuz; `ANALYSIS_PROVIDER=gemini`, `GEMINI_MODEL` varsayılan `gemini-3-flash`), **Claude sonrası** (`@anthropic-ai/sdk`, tek env ile devreye girer). **Yapısal JSON çıktı** (Gemini responseJsonSchema / Claude forced-tool), zod + mantık guard'ları + prompt-feedback retry. v1'de canlı grounding (web arama) **kapalı** — kanıt zayıfsa analist "doğrulanmalı" der (felsefe zaten bu). Kademeli maliyet + grounding **faz 2**. Sinyal × aktif mercek başına: `{lens, fit 0-100, rationale, evidence[] (her olgu kaynak atfıyla), adaptation_notes, risks[], confidence, validation_needed[] (zorunlu Validation Block), recommended_action: pursue|watch|kill, tags[]}`. **Zod-sonrası mantık guard**: (a) bant-aksiyon tutarlılığı (fit 85 + kill yasak), (b) güven kapısı (80+ bandı yalnız `confidence: high`), (c) atıfsız olgu reddi, (d) `validation_needed` boşken izle reddi — ihlal = yeniden dene. Şema + bant kuralları: `THESIS_AND_LENS.md §2`. **Analist fine-tune edilmez — grounding ile çalışır** (v1: tez config + web arama + few-shot örnekler + Bilgi Katmanı bağlamı; gerçek RAG/pgvector + memory faz 2, bkz. bileşen 8). Persona = karar fonksiyonu; detay: `AI_ANALYST.md`, `MARKET_KNOWLEDGE.md`.
7. **Ranker** — **v1: tek mercek → kompoze edilecek bir şey yok.** Sırala = `arbitrage_fit` (0-100, katı bant kuralı: 80+/50-79/0-49 — `THESIS_AND_LENS.md §2`); tazelik **yalnız aynı bant içinde** tiebreak (skora karışmaz) — eski-yüksek-skor yeni fırsatı ezemez, tersi de olmaz. Ağırlık/momentum/feedback-tuning yok. **Kompozit skor (mercek uyumları ağırlıklı + momentum) faz 2** — ikinci mercek gelince anlam kazanır.
8. **Bilgi Katmanı (Knowledge Layer)** — **canlı, `interface` arkasında** (`packages/core/knowledge.ts`): `apps/worker/src/lib/knowledge-db.ts` `decisions`+`comments`'i sinyalin `sector`/`market`'ıyla **lexical eşleştirip** (tam eşleşme + kelime örtüşmesi) en alakalı 8'ini analiste bağlam olarak enjekte ediyor — "daha önce gördük mü / ne karar verdik" sorusuna kısmi cevap zaten var, "bağlamsız" değil. **Düzeltme (2026-08):** PLAN.md'nin varsaydığı gstack `gbrain`, bu ürünün runtime'ının (apps/worker) çağırabileceği bir embedding/vektör servisi DEĞİL — bu kod tabanını Claude'un aramak için kullandığı bir geliştirici aracı. Gerçek semantik arama isteniyorsa `pgvector`'ı Supabase'e **kendimiz** kurmamız gerekir (yeni tablo + embedding modeli + backfill). Bu, `decisions` havuzu küçükken (2026-08-07'de 32 kayıt) erken bir yatırım olduğu için **bilinçli ertelendi** — havuz 50-100'e çıkınca yeniden değerlendirilecek.
9. **Sunum**:
   - **Kuyruk UI** — **Next.js (React) + Tailwind**; tasarım Figma'dan. kovala/izle/ele butonları `decisions`'a yazar. `validation_needed` dolu kayıtlar **"doğrulama bekliyor"** işaretiyle gösterilir — belirsizlik → insan kararı köprüsünün ürün yüzü.
   - **Bilgi sorgu arayüzü** — bilgi tabanına basit arama/soru (faz 2'de zenginleşir).
   - **Digest** — en iyi N + gerekçe; markdown → opsiyonel `/make-pdf` veya e-posta. Ek bölüm: **"doğrulama bekleyenler"** — analistin istediği eksik veriler insana görev listesi olarak sunulur.
10. **Geri-besleme döngüsü** — `decisions` tablosu; insan kararları hem ranker ağırlıklarını/tezi ayarlar hem de Bilgi Katmanını zenginleştirir.

---

## Teknoloji Yığını (React odaklı) + Öneriler
- **Frontend + API**: **Next.js (React) + TypeScript + Tailwind CSS.** Tek framework hem UI hem API route'ları taşır; B2B'de auth/multi-tenant'a temiz uzar.
- **Runtime**: **Node.js** (zaten kurulu, v20). Bun yok.
- **Veritabanı**: **Supabase (Postgres)** — ücretsiz kademe, auth + `pgvector` hazır.
- **Ingestion worker**: ayrı Node süreci (Next.js dışında) + zamanlama. Seçenekler: `node-cron`, Supabase scheduled functions, ya da GitHub Actions cron. **Öneri**: ayrı worker + cron (UI'ı ingestion yükünden ayırır).
- **Scraping**: Playwright (gstack `/browse` zaten Playwright tabanlı) → kod tekrar kullanımı.
- **AI**: sağlayıcı-bağımsız analist. **MVP = Gemini** (`@google/genai`, `GEMINI_API_KEY`, model `GEMINI_MODEL`); **Claude sonrası** (`@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`). Seçim `ANALYSIS_PROVIDER` env. Kademeli model + grounding faz 2.
- **Bilgi tabanı**: v1 lexical eşleştirme canlı (bkz. bileşen 8). Gerçek semantik arama gerekirse **kendi `pgvector` altyapımız** (Supabase) — gstack `gbrain` bir geliştirici aracı, ürüne bağlanmaz.
- **Tasarım**: **Figma paylaşılınca** `mcp__figma__get_figma_data` + `mcp__figma__download_figma_images` ile token/komponent/asset çekilir; gstack `/design-html` ile üretim kalitesinde React komponentlerine dönüştürülür.
- **Repo**: `git init` (şu an git repo değil) → gstack `/review`, `/cso`, `/ship` çalışsın.

### Ek öneriler
- **Monorepo** (`apps/web` Next.js, `apps/worker` ingestion, `packages/core` Signal+tez+analist mantığı paylaşımlı). Faz 2 multi-tenant'a en temiz yol.
- **`packages/core` framework-bağımsız** tutulsun (saf TS) → ileride farklı arayüz/CLI'a taşınabilir ("genel yapı" hedefiyle uyumlu).
- **Tez ve kaynaklar config-driven** — kod değil veri; B2B'de her müşteri kendi tezini/kaynağını alır.
- **Idempotent ingestion** — tekrar çalıştırınca dup üretmesin (hash + unique index).
- **LLM çıktısı için şema doğrulama** (zod) — bozuk JSON'ı yakala, yeniden dene.

---

## Geliştirme Fazları (milestone'lar)
1. **İskelet**: `git init`; monorepo; `Signal` şeması + Supabase tabloları + dedup; `sources.config.ts` + `thesis.config.ts` + `lenses.config.ts` taslakları.
2. **Tek kaynak uçtan uca** (YC ya da ProductHunt; RSS/scrape) → DB'de satırlar.
3. **Analist (tek mercek)**: Anthropic SDK + tez/mercek prompt + yapısal puanlama (zod). v1'de arbitraj merceği, tek model (`analysis_model`=Opus).
3b. **Eval harness (thin slice)**: **iki ayrık set** — (a) golden few-shot 5-6 gerçek vaka (co-creation: network ham olgu + tek-satır karar → asistan açar → network düzeltir; prompt'a girer), (b) eval seti **tam 20 vaka (7 kovala / 6 izle / 7 ele)**: ~14-15'ini asistan gerçek geçmiş sinyallerden hazırlar + taslak etiket → insan tek satırla onaylar. Script: analisti 20 vakada koştur → **ağırlıklı skor** (tam=1.0, komşu=0.5, kovala↔ele=0.0) + **3×3 confusion matrix** + mükerrer-çift tutarlılık. Kapsam tavanı: bir öğleden sonra; otomatize framework yok (bkz. `THESIS_AND_LENS.md §3`). Prompt tuning'in tek körlemesiz yolu.
4. **Sırala + digest**: v1 sıralayıcı = `arbitrage_fit` + tazelik → en iyi N markdown digest. (Kompozit ranker faz 2.)
5. **Bilgi Katmanı interface**: canlı — lexical eşleştirme (bkz. bileşen 8). **Gerçek pgvector semantik arama bilinçli ertelendi** (`decisions` havuzu küçükken erken yatırım; 50-100 kayda çıkınca yeniden değerlendir).
6. **Kuyruk UI**: Figma'dan Next.js komponentleri + kovala/izle/ele kalıcılığı.
7. **Kalan kaynaklar** (her scrape `skillify`); ingest+analiz cron'a bağlanır.
8. **Sertleştir**: `/review` + `/cso`, testler, `/ship`.
9. **Genişleme (v2, 2026-08-07'de başladı)**: çok-mercekli mimari + beyaz-alan merceği + kompozit ranker + kuyruk UI (landed) → triage/ön-eleme (landed) → YC Launches kaynağı (landed) → pgvector/RAG + memory (bilinçli ertelendi, `decisions` küçükken erken) → yeni mercekler, çıktı katmanını çeşitlendir (trend raporu, sektör haritası) — mimari buna açık.

---

## Doğrulama
- Faz 2 sonrası: ingest çalıştır → `SELECT count(*) FROM signals > 0`, dup URL yok.
- Faz 3 sonrası: bilinen bir yurt dışı launch makul `arbitrage_fit` + Türkiye için `adaptation_notes` alır; bozuk model çıktısı yakalanır (zod guard); **boş/eksik `validation_needed` ile izle çıktısı ve bant-aksiyon çelişkisi mantık guard'da reddedilir**.
- Faz 3b sonrası: **eval harness çalışır** — 20 vakalık set üzerinde ağırlıklı skor + confusion matrix ölçülür; bu, analist prompt'unu tune etmenin ana sinyalidir.
- Faz 4 sonrası: digest en iyi N'i `arbitrage_fit`+tazelik sırasına göre gerekçeyle sıralar.
- Faz 5 sonrası: kuyruk UI'da kovala/ele → `decisions`'a satır düşer, sonraki çalıştırmada sıralama bunu yansıtır.
- Uçtan uca: bir cron tick'i yeni sinyalleri toplar, puanlar, kuyruğu manuel adım olmadan günceller. Network güvenmeden önce `/review` + `/cso` temiz geçsin.

---

## Riskler & Açık Kararlar
- **Kaynak kırılganlığı**: site değişince scraper bozulur → `skillify` + kaynak-başı health check; RSS/API kaynakları öncelikli.
- **AI gürültüsü / uydurma uyum**: yapısal çıktı + güven eşiği; derin analiz yalnız kısa listeye; tez `anti_patterns` ile bilinen yanlış pozitifleri bastır.
- **API maliyeti**: v1'de hacim düşük → tek model (Opus) + analiz öncesi dedup yeter; kademeli sonnet/opus + batch faz 2 (hacim zorlayınca).
- **X/LinkedIn**: yalnız faz 2; ücretli X API veya manuel — MVP'yi bunlara bağlama.
- **Açık karar**: Supabase mi (öneri) yoksa lokal SQLite başlangıç mı? Figma linki ne zaman gelir (UI fazı onu bekler)?
- **Açık karar (strateji, ilgili dokümanlarda izleniyor)**: beachhead segment kesinleştirme (`BUSINESS_MODEL.md §9`); varsayılan analist arketipi + debate tetik eşiği (`AI_ANALYST.md §9`). (Somut tez değerleri `THESIS_AND_LENS.md §1`'de v1 için **dolduruldu**.)
