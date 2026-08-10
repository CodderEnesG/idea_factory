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

## 10. Faz 3 — Admin araçları, düzenlenebilir tez/mercek, çıktı çeşitlendirme, AI Yorumcusu (planlandı 2026-08-08, henüz uygulanmadı)

Kullanıcı kararıyla netleşen kapsam — sırayla:

**A. Admin rolü (önkoşul, B ve E'yi paylaşır).** `members` tablosuna `is_admin boolean default false`
eklenir, session (JWT) bunu taşır, `lib/auth.ts`'e `requireAdmin()` benzeri bir kontrol eklenir,
`add-member.ts`'e `--admin` bayrağı eklenir.

**B. Tez editable.** `thesis_versions` tablosu (jsonb + version + aktif mi + kim/ne zaman)
— kaydetmek yeni versiyon açar (mevcut "versioned" felsefesi korunur, eski versiyonlar
denetim/rollback için durur). Worker her pipeline koşusunda aktif versiyonu DB'den çeker;
`thesis.config.ts`'teki değer yalnız ilk-kurulum/DB-erişilemez fallback'i olur. Admin formu:
`/admin/tez` — capital_range/risk_appetite serbest metin, target_markets/sectors/capabilities/
anti_patterns etiket-listesi editörü.

**C. Mercek editable — iskeletli soru editörü (kullanıcı kararı: tam serbest prompt DEĞİL).**
Karar gerekçesi: `arbitrageLens`/`whiteSpaceLens` kendi Zod şeması + kalibre golden eval setiyle
geliyor — admin panelinden birebir yeniden üretilemez, kalitesiz mercek riski yüksek. Bunun yerine:
- Yeni admin-mercekleri ortak jenerik şemayı kullanır: `BaseAnalysisSchema` + tek genel `extra_note`
  alanı (admin "ek not etiketi"ni de girer, örn. "Zamanlama notu").
- Admin SADECE "bu mercek neyi sorsun" (domain soru listesi) + ad + ağırlık + etiket girer.
  Guard kuralları (bant-aksiyon tutarlılığı, atıfsız-olgu reddi, güven kapısı) ve tez-enjeksiyonu
  KODDA SABİT kalır — admin bunları bozamaz.
- `lenses` DB tablosu (id, name, weight, extra_note_label, questions, active, created_at).
  Arbitraj/beyaz-alan builtin kalır (DB'de yok, silinemez/düzenlenemez); admin sadece EKLER.
  Worker runtime'da `lenses.config.ts`'in statik dizisi + DB'den çekilen aktif custom mercekleri
  birleştirir.
- Kart UI'ı zaten veri-güdümlü (`CardView.lensViews`) — yeni mercek otomatik render olur,
  UI tarafında ek iş gerekmez.
- `/admin/mercekler` — liste + ekle/düzenle/aktif-pasif formu.

**D. Çıktı katmanı çeşitlendirme — ikisi birlikte (kullanıcı kararı).** Sıfır ek AI maliyeti,
mevcut veriden agregasyon:
- **Sektör Haritası** (`/harita`): sinyalleri sektör×pazara göre gruplar, bant dağılımı +
  bench yoğunluğu gösterir.
- **Trend Raporu** (`/trend`): `posted_at`/`fetched_at` üzerinden haftalık bucket'lanmış
  sektör/kaynak/bant dağılım değişimi. Grafik eklenirse önce `dataviz` skill'i yüklenmeli
  (renk/mark kuralları için).
- İkisi de tüm ekibe açık (admin kısıtı yok) — Navbar'a link eklenir.

**E. AI Yorumcusu — çok-ajanlı tartışma odası (admin-only, kullanıcı kararı).**
- Tetikleme: admin bir fırsat kartında "AI Yorumcusu başlat" butonuna basar — otomatik/toplu
  DEĞİL (1134+ sinyalde koşturmak maliyetli, admin seçtiğinde tetiklenir).
- Roster (kullanıcı onayı — önerilen varsayılan): **İyimser Kurucu / Şüpheci Yatırımcı /
  Pazar-Rekabet Analisti + Moderatör**. Her rol 2 tur (açılış + itiraz/rebuttal), Moderatör
  1 sentez turu — sabit ve öngörülebilir çağrı sayısı (maliyet kontrolü).
- Kurallar: her turda kanıt atfı zorunlu (mevcut guard felsefesiyle tutarlı), önceki
  konuşmacıya adıyla atıfla itiraz edebilir, rol dışına çıkamaz, son turda kendi kovala/izle/ele
  pozisyonunu netleştirmek zorunda.
- Sonuç: tam transkript + Moderatörün sentezlediği nihai kovala/izle/ele + yorum. `analyses`
  tablosuna DEĞİL, ayrı `debates` tablosuna yazılır (nitel tartışma, ağırlıklı-ortalama
  kompozit skora karışmaz). `signal_id, created_by, transcript jsonb, final_verdict,
  final_commentary, created_at`.
- Görünürlük: yalnız adminler görür/tetikler (kullanıcı kararı) — kartın mevcut aç/kapa
  desenine uyan admin-only bir bölüm.

**Uygulama sırası:** A → B → C → D → E sırayla uygulandı (2026-08-09). Faz 3 tamamlandı.

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

---

## 11. Faz 4 aday listesi — sonraki geliştirme yönleri (2026-08-09 taraması, henüz seçilmedi)

Faz 3 (A–E) tamamlandıktan sonra kod tabanı + `BUSINESS_MODEL.md` taranarak çıkarılan somut aday
adımlar. Hiçbiri henüz uygulanmadı — kullanıcı yönü seçtiğinde işaretlenip uygulanacak.

1. **pgvector/RAG (Bilgi Katmanı gerçek semantik arama)** — §8'de "`decisions` 50-100 kayda çıkınca
   yeniden değerlendir" denmişti (2026-08-07'de 32 kayıt). Eşiğe ulaşılıp ulaşılmadığı kontrol
   edilmeden atlanmamalı.
2. **Kademeli model + grounding** (madde 6, faz 2 notu) — şu an her sinyal tek modelle (Gemini/Opus)
   puanlanıyor, gerçek web-arama grounding'i yok; hacim arttıkça maliyet/kalite dengesi için en
   yüksek kaldıraçlı iş.
3. ~~**Yeni mercekler**~~ — **TAMAM (2026-08-09), kapsam kullanıcı kararıyla daraltıldı: zorunlu
   yeni built-in mercek EKLENMEDİ** (mevcut arbitraj+beyaz-alan korunuyor); kullanıcının kendi
   mercek ekleme akışının uçtan uca sağlam olduğu doğrulandı/sağlamlaştırıldı. Bulgu: pipeline
   zaten tamdı (`apps/worker/src/analyze.ts` `loadActiveCustomLenses()`'i çağırıp
   `[...lenses, ...customLenses]` üzerinden dönüyordu, `analyzeSignal()` her mercek için jenerik
   çalışıyordu — varsayım yanlış çıktı, gerçek "wiring" eksiği yoktu). Ama kod okurken GERÇEK bir
   bug bulundu: `ranker.ts`'teki `composite()` custom mercek ağırlığını HİÇ kullanmıyordu — admin
   `/admin/mercekler`de weight=5 girse bile kompozitte hep weight=1 sayılıyordu (statik
   `WEIGHT_BY_LENS` yalnız builtin `lenses` dizisinden kuruluyordu). Düzeltildi:
   `composite()`/`rank()`/`buildDigest()`/`benchItems()` artık opsiyonel `lensRegistry` alıyor;
   `/queue`, `/harita`, `/trend`, `/admin/metrikler` (`apps/web/lib/load-lens-registry.ts` —
   queue'daki yerel kopya oradan çıkarıldı, 4 sayfa paylaşıyor) ve worker'ın `digest.ts`'i
   (`loadActiveCustomLenses()` eklendi) hepsi artık tam kayıt defterini geçiyor. Verilmezse
   (`rank(items)`, `composite(analyses)`) davranış eskisiyle birebir aynı — geriye dönük uyum,
   custom mercek şu ana kadar hiç oluşturulmadığı için bu bug hiç tetiklenmemişti. 5 yeni test
   (`ranker.test.ts`, `digest.test.ts`).
4. ~~**Admin/auth kodu hiç güvenlik taramasından geçmedi**~~ — **TAMAM (2026-08-09).** `/cso`
   taraması yapıldı (rapor: `.gstack/security-reports/2026-08-09-163356.json`). RLS
   (thesis_versions/lenses/debates) ve requireAdmin() kapıları temiz çıktı. 3 gerçek bulgu
   bulunup düzeltildi: (1) `/api/auth/login`'de rate-limit/kilitleme yoktu → `lib/rate-limit.ts`
   eklendi (5 deneme/5dk → 5dk kilit, tek-process in-memory — bu app'in `pnpm dev`/`next start`
   tek-süreç modeliyle tutarlı); (2) kullanıcı adı yokken erken dönüş timing ile kullanıcı adı
   keşfine izin veriyordu → `verifyPasswordConstantTime` (decoy hash) ile sabit maliyetli hale
   getirildi; (3) `/api/decisions` + `/api/comments` yalnız middleware'in `authEnabled()`
   kapısına güveniyordu (2026-08-04'teki okuma-sızıntısıyla aynı kök neden sınıfı, bu kez yazma
   tarafında) → route seviyesinde ikinci bir kontrol eklendi. Session revocation eksikliği
   bilinçli olarak DÜZELTİLMEDİ (mimari tradeoff, mevcut ölçekte kabul edilebilir — raporda not
   düşüldü). 24 yeni test (`lib/rate-limit.test.ts`, `lib/password.test.ts`,
   `app/api/auth/login/route.test.ts` + decisions/comments'e eklenen 401 testleri).
5. ~~**`apps/web` (Next.js) için hiç test yok**~~ — **TAMAM (2026-08-09).** `/api/decisions`,
   `/api/comments`, `/api/admin/thesis`, `/api/admin/lenses`, `/api/admin/lenses/[lensId]`,
   `/api/admin/debates` için 6 test dosyası + 33 test (vitest, Supabase/auth mock'lanır).
   `apps/web` de artık `pnpm -r test`'e dahil.
6. ~~**Geri-besleme döngüsü PLAN'ın vaat ettiği kadar canlı değil**~~ — **TAMAM (2026-08-09).**
   `ranker.ts`'teki `rank()` artık opsiyonel bir `bandOverride` alıyor: `/queue` sayfası, oturum
   sahibinin kendi `decisions` kaydı varsa AI kompozit bandının yerine geçiriyor (ör. insan
   "ele" demişse AI "kovala" dese bile sinyal en alta iner) — 4 yeni ranker testi. Kapsam bilinçli
   dar tutuldu: `decisions` kullanıcı-bazlı olduğu için bu override yalnız `/queue`'da (oturum
   sahibinin kendi görünümü) uygulanıyor, paylaşılan `digest.ts`'e (tüm ekip için tek çıktı,
   kimin kararının kazanacağı belirsiz) BİLİNÇLİ olarak taşınmadı — `rank()` ikinci parametre
   olmadan eskisiyle birebir aynı davranır (digest/worker regresyonsuz). Bilgi Katmanı tarafı
   zaten Faz 5 öncesinde tamamlanmıştı (bkz. bileşen 8).
7. ~~**Digest dağıtımı hâlâ manuel/lokal**~~ — **TAMAM (2026-08-09), lokal-öncelikli tarzla
   tutarlı bir çözümle** (e-posta/SMTP gibi yeni ücretli/harici bağımlılık EKLENMEDİ). Kök sorun
   dağıtım kanalının GitHub Actions artifact'i olmasıydı (30 gün sonra silinir, indirmek gerekir)
   — asıl kayıt artık DB'de: `supabase/migrations/0010_digests.sql` (yeni `digests` tablosu, 0005
   RLS deseni — **kullanıcı Supabase Dashboard'dan UYGULAMALI**, henüz yapılmadı). `apps/worker/
   src/digest.ts` her koşuda hem lokale (`digests/*.md`, değişmedi) hem bu tabloya yazıyor. Yeni
   `/digest` sayfası (tüm authenticated kullanıcılara açık, admin-only değil — queue/harita/trend
   ile aynı görünürlük): geçmiş çalıştırmalar listesi + seçili digest'in markdown'ı düz metin
   olarak render edilir (LLM çıktısı — `dangerouslySetInnerHTML` KULLANILMADI, XSS riski
   yaratmamak için, bkz. `.gstack/security-reports` Phase 7 ilkesi). `apps/web/lib/load-lens-
   registry.ts` çıkarıldı (queue'daki yerel kopya oradan taşındı, madde 3 sağlamlaştırmasının
   parçası). Demo modda `DEMO_ITEMS`'tan gerçek `buildDigest()` ile üretilen tek örnek gösterilir
   (queue/harita/trend'le aynı desen). Görsel doğrulama: izole port 3101, gerçek DB'ye
   dokunulmadan, ekran görüntüsüyle konsol hatasız onaylandı.
8. ~~**North Star / leading-indicator metrikleri hiç ölçülmüyor**~~ — **TAMAM (2026-08-09).**
   `/admin/metrikler` sayfası eklendi (`apps/web/lib/metrics.ts`, 9 pure-function test):
   haftalık nitelikli fırsat sayısı + son 8 hafta grafiği, karar/sinyal oranı, gürültü oranı
   (karşı-metrik) gerçek veriden hesaplanıyor. **North Star'ın kendisi ("kovala" isabeti) ve
   bilgi-tabanı sorgu kullanımı BİLİNÇLİ OLARAK "ölçülemiyor" gösteriliyor** — outcome/doğrulama
   takibi ve sorgu loglaması henüz yok, sahte sayı üretmek yerine dürüstçe boş bırakıldı (bkz.
   sayfadaki açıklama metni). Gerçek North Star ölçümü için ayrı bir outcome-tracking tablosu
   gerekir — henüz kapsamda değil.
9. **Ticari doğrulama planı — kod işi DEĞİL, kullanıcı yürütür.** `BUSINESS_MODEL.md §9`'da zaten
   somut 4 adım var, PLAN pipeline'ına girmiyor, yalnız burada özetleniyor (netleştirme
   2026-08-09):
   1. **Sorun mülakatları (hafta 1-4):** `BUSINESS_MODEL.md §3`'teki ilk 2 segmentten 3-5 kişiyle
      görüşme — tekrarlayan, ödemeye istekli "acı" var mı? Beachhead'i bu kesinleştirir.
   2. **Design partner (2-3):** erken erişim ↔ geri bildirim + referans.
   3. **Fiyat-duyarlılık:** `§6` kademelerini test et, LOI hedefle.
   4. **Çıkış kriteri (Faz 2'ye geçiş):** ≥2 imzalı LOI/pilot **ve** North Star'ın (madde 8,
      `/admin/metrikler`) anlamlı bir sinyal gösterdiği veri.
   Madde 8'deki metrik sayfası artık (4)'teki North Star kanıtı için kullanılabilir durumda.
   Henüz başlanmadı — kullanıcı ne zaman başladığını/sonucunu bildirdiğinde burası güncellenir.
10. ~~**Kaynak sağlığı izlenmiyor**~~ — **TAMAM (2026-08-09).** Not: metinde "6 kaynak" deniyordu,
    taramada düzeltildi — worker'da **5** kayıtlı kaynak var (`apps/worker/src/ingest.ts`
    `SOURCES`: productHunt, tldr, webrazzi, techcrunch, ycombinator); "WP feed" ayrı bir kaynak
    değil, webrazzi+techcrunch'ın kullandığı ortak RSS fabrikası (`wpfeed.ts`). `/admin/metrikler`
    sayfasına "Kaynak sağlığı" tablosu eklendi (`apps/web/lib/source-health.ts`, 11 test): her
    kaynak için son 7g/30g sinyal sayısı + son görülen tarih + durum (sağlıklı <2g, yavaşladı
    2-7g, sessiz >7g, hiç veri yok). `tldr:kategori` alt-kaynakları tek "tldr" kovasında toplanır.

11. **Mercek backfill — pencere tuzağı** (bulundu 2026-08-10; §11 aday listesinde YOKTU).
    `analyze.ts:fetchShortlist` ve `triage.ts:fetchToTriage` yalnız **en yeni pencereyi** tarar
    (`ANALYZE_LIMIT*20` / `TRIAGE_LIMIT*5` satır) — ucuz ve hızlı, ama bir mercek SONRADAN
    eklendiğinde eski sinyaller o pencereye bir daha asla girmez. Beyaz-alan merceği
    (2026-08-07) tam bu tuzağa düştü: `analyses` lens=arbitrage **873** vs lens=white_space
    **74**; kovalanabilir 916 sinyalin **842'sinde** beyaz-alan analizi yoktu. Sonuç:
    `composite()` tek mercek görünce o merceğin fit'ini aynen döndürdüğü için **kompozit
    sıralama kartların %92'sinde fiilen tek-mercekliydi** — madde 3'ün ağırlık düzeltmesi ve
    madde 6'nın band-override'ı da bu boş varsayımın üstünde duruyordu. Aynı tuzak triage'da
    da vardı (1251 sinyalin yalnız ~156'sında `triage_score`).
    Çözüm: `apps/worker/src/backfill-lens.ts` (tabloyu sayfa sayfa tarar, eksikleri
    `triage_score` sırasına göre işler, `BACKFILL_MAX` ile kademeli harcar, resumable) +
    `triage.ts`'e `TRIAGE_SCAN_ALL=true` sayfalı mod. Tek-sinyal analiz+upsert adımı
    `lib/analyze-one.ts`'e çıkarıldı — `analyze.ts` ile backfill aynı yolu paylaşır (iki upsert
    yolu = iki bug). İkisi de **tek seferlik bakım aracı**, cron `tick`'ine girmez; `analyze.ts`
    ve `triage.ts`'in varsayılan davranışı değişmedi.
    Ölçüm notu: analiz başına ~3 dk (ağır JSON şeması + uzun prompt) → 842 sinyal sıralı ≈ 42
    saat, kullanılamaz. `BACKFILL_CONCURRENCY` (varsayılan 4) paralel havuz açar; 1 = eski
    sıralı davranış (kota sorununda buna düş).

    **Pilot bulgusu — beyaz-alan merceği kompozit skordan ÇIKARILDI (ağırlık 1 → 0).**
    20'lik pilot koşusu (2026-08-10) merceğin arbitrajdan gerçekten ayrıştığını gösterdi
    (84 çift-mercekli sinyalde aksiyonların %54'ü farklı, ortalama fit 14.5 puan düşük) — ama
    **hiçbirinde "kovala" demiyor** (arbitrajda %5.8). Kök neden merceğin kendi prompt'unda:
    80+ bandı `confidence: high` istiyor, ama talimat "yerli rekabet taraması v1'de zayıf
    (web_search kapsamı sınırlı) → confidence düşür" diyor — yani **grounding kapalıyken fit
    yapısal olarak 79'a çakılı.** Kompozite karışınca arbitrajın kovala bandını siliyordu;
    ölçülen kovala sayısı (aynı 84 sinyal): ağırlık 0 → 12, 0.25 → 3, 0.5 → 2, 1 → 1.
    Muhalefetin ne kadarı gerçek sinyal, ne kadarı grounding körlüğü — bugün ayırt edilemiyor,
    o yüzden körlük sıralamaya taşınmıyor. Mercek kartta / `/harita` / `/trend`'de ikinci görüş
    olarak görünmeye devam eder (`lensViews` ağırlıktan bağımsız). `composite()`'e sıfır-bölme
    guard'ı eklendi (tüm ağırlıklar 0 ise düz ortalamaya düşer, NaN üretmez).
    **Grounding (madde 2) devreye girince ağırlık 1'e çıkarılmalı — asıl tasarım o.**

    Kota/kalite notu: Vertex 5 paralelde 429 RESOURCE_EXHAUSTED veriyor (varsayılan paralellik
    3). Pilotta 20 sinyalin 8'i yazıldı, 5'i kota, 5'i "4 denemede geçerli analiz üretemedi" —
    bu sonuncusu sinyal başına 4 LLM çağrısı yakıp hiçbir şey üretmiyordu ve hatanın ŞEMA mı
    GUARD mı olduğu log'dan görünmüyordu; `analyst.ts` artık son ihlali hataya iliştiriyor.

    **Sessiz üretim bug'ı — `lens` id'si (bulundu bu teşhisle).** Yukarıdaki "4 denemede
    üretemedi" hatalarının nedeni kalibrasyon DEĞİLmiş: model `lens` alanını `"white-space"`
    (tire) yazıyor, `z.literal("white_space")` reddediyor, 4 deneme de aynı şekilde düşüyordu.
    Arbitraj tek kelime (`arbitrage`) olduğu için bu tuzağa hiç düşmemişti — **alt tire içeren
    HER mercek, `/admin/mercekler`de eklenecek custom mercekler dahil, düşüyordu.** Yani
    beyaz-alan merceğinin 2026-08-07'den beri düşük analiz sayısının bir kısmı da bu bug.
    Düzeltme (`analyst.ts`): `lens` alanı çağıranın zaten bildiği metadata — şemaya vermeden
    önce doğru id yazılıyor, modele sordurulmuyor (saf başarısızlık yüzeyi kaldırıldı).
    3 yeni test (`analyst.test.ts` — yeni dosya). **Ölçülen etki** (12'lik partiler, aynı aday
    havuzu): düzeltme öncesi 8/20 ve 7/12 başarı + 5 ve 4 şema hatası → düzeltme sonrası
    **11/12 başarı, 0 şema hatası**; kalan tek hata kaynağı Vertex kotası (429). Yani sinyal
    başına boşa yakılan 4-çağrılık döngü ortadan kalktı.

    Durum (2026-08-10 kapanış): `analyses` lens=white_space **74 → 102**; 814 aday kaldı.
    Backfill'in kalanı **aciliyetini yitirdi** — ağırlık 0 olduğu için sıralama doğruluğunu
    etkilemiyor; değeri eski kartlarda ikinci görüş + `/harita`//`/trend` zenginliği. Parti
    parti (`BACKFILL_MAX`) koşturulacak bir bakım işi.

**Öncelik notu (2026-08-09 taramasında verilen tavsiye):** en ucuz/en yüksek güven — madde 5 (admin
API testleri) veya madde 8 (metrik sayfası, sıfır AI maliyeti). En stratejik ama daha büyük iş —
madde 6 (gerçek geri-besleme döngüsü) veya madde 2 (kademeli model + grounding).

**Kullanıcı kararı (2026-08-09): sıra 5 → 8 → 6.** Aynı oturumda otomatik pipeline olarak
uygulandı (kullanıcı: "pipeline'a al, sürekli sorma, otomatik ilerle") — **üçü de TAMAM.**

**İkinci tur kullanıcı kararı (aynı oturum, aynı gün): 4 + 10 → 3 → 7 → (2 sonra düşünülecek).**
Madde 3 (yeni mercek) için açık kısıtlama: **zorunlu yeni built-in mercek eklenmeyecek** —
mevcut mercekler (arbitraj + beyaz-alan) korunur, kapsam yalnız kullanıcının kendi mercek
ekleme/değiştirme akışının (Faz 3-C admin-mercek UI) uçtan uca çalıştığını doğrulamak/
sağlamlaştırmak. Madde 9 kod pipeline'ına girmiyor (yukarıda somutlaştırıldı, kullanıcı
tarafından ayrıca yürütülecek).

**Bu turun kapanışı (2026-08-09/10, aynı oturum): 4, 10, 3, 7 — DÖRDÜ DE TAMAM.** Kullanıcıda
kalan tek elle-yapılacak iş: `supabase/migrations/0010_digests.sql`'i Supabase Dashboard → SQL
Editor'den uygulamak (0003/0006/0007/0008/0009 ile aynı desen) — uygulanana kadar `/digest`
sayfası gerçek ortamda boş liste gösterir (çökmez, `loadDigests()` hatayı yutup `[]` döner).
Sıradaki: yalnız **madde 2** (kademeli model + grounding) kaldı, henüz başlanmadı — büyük/
stratejik bir karar, kullanıcıyla kısa bir tasarım turu gerekir (bkz. [[feedback-explain-
before-big-decisions]]).
