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

1. ~~**pgvector/RAG eşik kontrolü**~~ — **KONTROL EDİLDİ (2026-08-10), pgvector yine ERTELENDİ.**
   `decisions`+`comments` = 85 kayıt (2026-08-07'de 32'ydi) — eşik (50-100) teknik olarak
   geçildi. Ama gerçek veri incelemesi (60 kararın sector/market dağılımı) gösterdi ki zayıflık
   "paraphrase yakalanamıyor" değil: kararların %77'si tek sektör etiketinde ("B2B SaaS")
   toplanıyor — bu bir eşleştirme hatası değil, **tezin kendi dar sektör listesinin**
   (`thesis.config.ts`: B2B SaaS, fintech, e-ticaret altyapısı, vertical SaaS) doğal sonucu.
   Kategorik eşleştirme çalışıyor, yalnız kova kalabalık. Çözüm pgvector değil, ucuz bir lexical
   genişletme: `apps/worker/src/lib/knowledge.ts::relevance()` artık kategorik kapıdan (sector+
   market) geçen çiftlerde başlık+özet kelime örtüşmesini de skora ekliyor (jenerik kelimeler
   stopword'le filtrelenir, skor tavanlı) — aynı kovadaki kayıtları birbirinden ayırt eder.
   Kategorik örtüşme yoksa içerik metnine hiç bakılmıyor (gürültü riski yok). pgvector'ı
   gerektirecek gerçek senaryo (Türkçe not ↔ İngilizce başlık çapraz-dil eşleştirmesi) hâlâ teorik
   — ölçülmedi. Yeniden değerlendirme: tez sektör listesi genişlerse veya çapraz-dil ihtiyacı
   somutlaşırsa.
2. **Kademeli model + grounding** (madde 6, faz 2 notu) — şu an her sinyal tek modelle (Gemini/Opus)
   puanlanıyor, gerçek web-arama grounding'i yok; hacim arttıkça maliyet/kalite dengesi için en
   yüksek kaldıraçlı iş.

   **Grounding yarısı — kod hazır, DEVREDE DEĞİL (2026-08-19).** `packages/core/grounding.ts`:
   yalnız arbitraj+beyaz-alan merceklerinde, asıl yapılandırılmış analiz çağrısından ÖNCE serbest
   bir Google Search ön-çağrısı (`GROUNDING_ENABLED=true` ile açılır, varsayılan kapalı — sıfır
   prod riski). Teknik kısıt: Gemini/Anthropic'in structured-output modu (responseSchema /
   forced tool-use) ile arama tool'u aynı çağrıda birleşemiyor, o yüzden iki-adımlı (grounding
   metni asıl prompta düz metin olarak eklenir). 20sn timeout var (`GROUNDING_TIMEOUT_MS`).

   **Pilot sonucu (2026-08-19, 20'lik eval seti) — YETERSİZ, karar vermeye yetmiyor.** Koşu
   sırasında ~8 vaka geçici bir DNS kesintisiyle (`oauth2.googleapis.com` ENOTFOUND) tamamen
   düştü (0 puan, paydada kaldı) — ham skor (0.475) bu yüzden yanıltıcı. Yalnız ağdan etkilenmeyen
   12 vakada baseline 0.958 (11.5/12) → grounding açıkken 0.875 (10.5/12): tek bir zıt-uç flip
   (Faturaport: doğru "kovala" → yanlış "ele") skoru düşürüyor, geri kalanı nötr/karışık. n=12 çok
   küçük, gürültüden ayırt edilemiyor — **white_space ağırlığı (0→1) bu veriyle DEĞİŞTİRİLMEDİ.**
   Sıradaki: ağ sorunu olmadan temiz bir pilot tekrarı, sonra karar.
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
   RLS deseni — **uygulandı** [2026-08-12'de REST API ile doğrulandı: `GET .../rest/v1/digests`
   200 döndü, kayıt var]). `apps/worker/
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

**Bu turun kapanışı (2026-08-09/10, aynı oturum): 4, 10, 3, 7 — DÖRDÜ DE TAMAM.**
`supabase/migrations/0010_digests.sql` de uygulandı (2026-08-12, Supabase REST API üzerinden
doğrulandı — `digests` tablosu DB'de mevcut ve dolu). Elle yapılacak iş kalmadı.
Sıradaki: yalnız **madde 2** (kademeli model + grounding) kaldı, henüz başlanmadı — büyük/
stratejik bir karar, kullanıcıyla kısa bir tasarım turu gerekir (bkz. [[feedback-explain-
before-big-decisions]]).

## 12. Faz 5 — UI/UX ve çalışma alanı (başladı 2026-08-12)

Faz 1-3 tamamlandı (pipeline + admin araçları). Kullanıcı bu kez ürünü "ham liste + filtre"
seviyesinden çıkarmayı istedi — 4 somut madde: (1) sayfa/menü/UI-UX yapısı baştan
tasarlanmalı, (2) yalnız adminler değil tüm ekip üyeleri rahat kullanabilmeli, (3) "kovala/
izle/ele" gerçek bir klasör yapısına dönüşüp aktif adım atılabilmeli, (4) her şey tek uzun
listede akmamalı (biçime karar verme kullanıcı tarafından bana bırakıldı).

Netleştirme (kullanıcıyla, aynı oturum): kapsam mevcut davetli `members` — public/self-signup
YOK; "aktif adım" = hafif görev/checklist katmanı, tam bir CRM/iş akışı motoru DEĞİL. Görsel
sistem (`BRANDING.md` §8: koyu tema/glass/marka renkleri, kovala-izle-ele paleti) **kilitli**
kalıyor — burada "baştan tasarım" IA/navigasyon/etkileşim seviyesinde.

Üç dilime bölündü:

1. ~~**Faz 5.1 — "Panom"**~~ — **TAMAM (2026-08-12).** Yeni `item_tasks` tablosu
   (`supabase/migrations/0011_item_tasks.sql`, `0005`'teki RLS deseniyle) + `/api/tasks`
   (POST) ve `/api/tasks/[taskId]` (PATCH, yalnız görevin sahibi veya admin işaretleyebilir).
   Yeni `components/TaskList.tsx` (`Comments.tsx` ile aynı iskelet), `OpportunityCard`'a
   `item.mine !== null` iken eklendi. Yeni `app/panom/page.tsx`: kararı verilmiş sinyaller
   Kovala/İzle/Ele başlıkları altında gruplanır, kararsız sinyaller hiç görünmez — Kuyruk'un
   arama/filtre/sonsuz-liste mantığı kasıtlı olarak yok (Kuyruk = keşif, Panom = zaten karar
   verilmiş olanı yönetme). `queue/page.tsx`'teki `loadDecisions`/`loadComments`/`loadDebates`
   yerel fonksiyonları `lib/load-decisions.ts` / `lib/load-comments.ts` / `lib/load-debates.ts`'e
   çıkarıldı (Panom da aynısına ihtiyaç duyduğu için — iki sayfa artık paylaşıyor), + yeni
   `lib/load-tasks.ts`. `Navbar`'a admin kapısı olmayan yeni "Panom" sekmesi eklendi (yalnız
   giriş yapmış kullanıcıya görünür). Madde 3'ü doğrudan, madde 4'ü kısmen çözer.

   **Navbar düzeltmesi (aynı gün, kullanıcı geri bildirimi: "menü çok karmaşıklaşmaya
   başladı").** Panom eklenince admin için düz sekme sayısı 8'e çıkmıştı (Kuyruk/Panom/
   Harita/Trend/Digest/Tez/Mercekler/Metrikler). Yeni `components/NavDropdown.tsx`
   (client, dışarı tıklayınca kapanan açılır menü, `glass` token'ıyla tutarlı) —
   Harita/Trend/Digest "Raporlar" altında, Tez/Mercekler/Metrikler (admin-only) "Admin"
   altında toplandı. Düz sekme sayısı admin için 4'e (Kuyruk/Panom/Raporlar/Admin), üye
   için 3'e (Kuyruk/Panom/Raporlar) indi. `browse` ile doğrulandı (gerçek `AUTH_SECRET`'le
   imzalanmış geçici test JWT'siyle): her iki dropdown açılıyor, aktif grup alt-çizgiyle
   vurgulanıyor, dışarı tıklayınca kapanıyor, iç linkler doğru sayfaya gidiyor, konsol
   hatasız.
2. ~~**Faz 5.2**~~ — **TAMAM (2026-08-13).** Kullanıcı: "pipeline'a al, soru sorma" —
   iki alt madde otomatik/soru sormadan yürütüldü:
   1. **Hızlı tarama.** Yeni `app/queue/tarama/page.tsx` + `components/TriageStack.tsx`:
      yalnız `mine === null` sinyaller, tek kart, `1/2/3` tuşları (Kovala/İzle/Ele — DOM'da
      `data-decision` özniteliğiyle `DecisionButtons`'ın gerçek butonuna tıklatılıyor, fetch
      mantığı tekrarlanmadı) veya `→` (Atla, karara bağlanmadan sıradakine geç). Karar
      verilince `DecisionButtons`'a eklenen `onDecided` callback'iyle otomatik ilerliyor.
      `/queue` başlığına yalnız kararsız sinyal varsa görünen "⚡ Hızlı tarama (N)" girişi
      eklendi — navbar'a YENİ bir sekme eklenmedi (madde 2'nin menü-sadeleştirme dersi
      tazeydi). `FitRing`/`BAND` `OpportunityCard`'dan `components/card-visuals.tsx`'e
      çıkarıldı (iki bileşen artık paylaşıyor). `browse` ile uçtan uca doğrulandı: `2`
      tuşuna basınca gerçek DB'ye İzle kararı yazıldı, sayaç 0/885 → 1/885 ilerledi, yeni
      kart geldi — test kaydı sonra temizlendi.

      **SÜPERSEDE (2026-08-13, §13 Faz 5.4).** Ayrı `/queue/tarama` sayfası ve
      `TriageStack.tsx` kaldırıldı — aynı deneyim (tek odak + oto-ilerleme) artık Kuyruk'un
      kendi sağ paneline "Yalnız kararsızlar" anahtarıyla taşındı. Aşağıda §13'e bakınız.
   2. **Harita/Trend/Digest görsel tutarlılığı — değerlendirildi, iş çıkmadı.** Üç sayfa da
      okundu: ikisi de zaten aynı `Navbar` + `mx-auto max-w-5xl px-6 py-8` + `font-display
      text-3xl font-bold` başlık + `glass` kart + demo-banner desenini kullanıyor
      (BRANDING.md §8'de kilitlenen sistemin doğal sonucu). Ayrı bir "redesign" işi
      icat etmek yerine bulgu olduğu gibi bırakıldı — gerçek bir tutarsızlık yoktu.
3. ~~**Faz 5.3**~~ — **KISMEN TAMAM (2026-08-13, dar kapsamlı geçiş).** Üye-yüzü kopyada
   somut, düşük riskli iki düzeltme: (1) ham İngilizce `low/med/high` enum'u artık
   `components/card-visuals.tsx::CONFIDENCE_LABEL` ile "düşük/orta/yüksek" gösteriliyor
   (OpportunityCard + TriageStack, 3 kullanım yeri). (2) fit halkasına `title="Uyum skoru:
   N/100"` tooltip'i eklendi. "Fit" terimi ve "Panom"/"bench" gibi zaten yerleşik/tekrar
   kullanılan terimler kanıt olmadan DEĞİŞTİRİLMEDİ (yüksek etki alanı, düşük kanıt —
   gereksiz kırılma riski). Tam kapsamlı dil denetimi hâlâ açık, ileride somut bir
   kafa karışıklığı sinyali gelirse ele alınır.

## 13. Faz 5.4 — Kuyruk'un yeniden mimarisi: sol/sağ panel + Panom "e şimdi ne olacak?" (TAMAM, 2026-08-13)

Kullanıcı tek mesajda yedi ayrı istek getirdi ve açıkça "pipeline'a al, hiç soru sorma, meta
pipeline ile kontrol et" dedi — bu yüzden hiçbiri AskUserQuestion ile sorulmadı, hepsi burada
gerekçesiyle birlikte kayıtlı (ileride "neden böyle karar verildi" sorusunun cevabı burası).

1. **Kuyruk'un tam yeniden mimarisi — sol liste + sağ detay paneli.** `components/QueueBoard.tsx`
   artık tek sütun tam-kart liste değil: sol tarafta taranabilir kompakt satırlar
   (`components/QueueRow.tsx` — puan, bant rengi, başlık, kaynak), sağda tıklanan sinyalin tam
   detayı (`components/DetailPanel.tsx` — her zaman açık, "detayları gör" toggle'ı yok, çünkü
   zaten tek odak). Seçim tamamen client-side state (`selectedId`) — sayfa yenilenmeden anında
   değişir. `/queue/tarama` sayfası ve `TriageStack.tsx` bununla birleşti: "Yalnız kararsızlar"
   anahtarı + oturum-içi `localMine`/`skipped` state'i aynı tek-odak + oto-ilerleme deneyimini
   sol/sağ panelin İÇİNDE veriyor — oto-ilerleme ekstra kod gerektirmedi: seçili öğe filtreden
   düşünce (`selected = filtered.find(...) ?? filtered[0]`) otomatik olarak bir sonraki
   kararsız sinyale düşüyor. Karar verilince tam sayfa yenilemeden liste/sayaçlar güncellensin
   diye `localMine: Map<id, Decision>` ile sunucu verisinin üstüne oturum-içi override
   bindiriliyor. `max-w-5xl` → Kuyruk özelinde `max-w-7xl` (iki panel yer istiyor), diğer
   sayfalarda `max-w-6xl` (kullanıcı: "sol ve sağdan margin çok fazla").
2. **Sürükle-bırak karar (Faz 5.4 madde 2).** Yeni `components/SwipeCard.tsx` — fare
   sürükleme + dokunmatik kaydırma, sağa=Kovala, sola=Ele, yukarı=İzle (eşik 110px, sürüklenen
   yöne göre renkli "damga" belirir). Buton/link/input üstünde başlayan sürüklemeler yok
   sayılır (tıklamalar bozulmasın). `1/2/3` klavye kısayolları da korundu (Hızlı tarama'dan
   miras). **Bulunan ve düzeltilen gerçek bug:** `DecisionButtons`'ın `chosen` state'i
   `useState(mine)` ile yalnız ilk mount'ta kuruluyor — TriageStack'te kart değiştiğinde
   (aynı ağaç konumu, yalnız prop değişimi) React state'i SIFIRLAMIYORDU, yani bir kart
   "İzle" işaretlenip ilerlenince bir SONRAKİ kart da yanlışlıkla "İzle ✓" gösterebilirdi.
   `DetailPanel`'de kök elemana `key={item.id}` eklenerek her sinyal geçişinde tam remount
   garanti edildi — TriageStack zaten kaldırıldığı için orada düzeltilmedi, ama aynı desen
   `PanomCard`/`QueueRow`'da zaten `.map()` içinde stabil `key`'e sahip oldukları için hiç
   risk taşımıyordu (yalnız "değişen tekli kart" deseninde ortaya çıkan bir sınıf hata).
3. **Panom'un "e şimdi ne olacak?" sorununa cevabı.** Kullanıcının tarif ettiği kopukluk (AI
   seçti → sen karar verdin → yorum yapıldı → AI tartıştı → e şimdi?) için yeni
   `components/PanomCard.tsx` — `OpportunityCard`'ın küçültülmüş kopyası değil, ayrı bir amaç:
   üstte tek satır "karar izi" (AI: {bant} · Sen: {karar} · uyuşmuyorsa "AI'dan farklı karar"
   rozeti · varsa AI Yorumcusu'nun nihai kararı), altında HER ZAMAN açık görev listesi (Kuyruk'un
   aksine `mine !== null` şartına bağlı değil — Panom'da zaten hep var). Analiz/yorumlar
   "Analiz ve yorumları gör" ile isteğe bağlı açılır — Panom tekrar okumak için değil, sonraki
   adımı atmak için var. `browse` ile gerçek veriyle doğrulandı: AI "Kovala" derken kullanıcı
   "İzle" dediği ve ekipten birinin ("muhammed") daha önce gerçek bir AI Yorumcusu tartışması
   ("ELE" sonucuyla) kaydettiği canlı bir sinyalde üçü de doğru göründü.
4. **Sayfa geçişleri artık "tıkla, donmuş gibi bekle" değil.** Yeni `components/PageSkeleton.tsx`
   (Navbar'ın statik iskeleti + nabız atan satırlar) — Kuyruk/Panom/Harita/Trend/Digest/
   admin/* rotalarının hepsine `loading.tsx` eklendi. Next App Router bunu RSC verisi
   gelmeden ANINDA gösteriyor; kök nedeni tam çözmüyor (ağır sorgular hâlâ ağır — bkz. madde 6
   altındaki not) ama "hiçbir şey olmuyor" hissini kırıyor.
5. **Tez/Mercek/Toplama tek çatı altında: "Ayarlar".** Navbar'daki "Admin" açılır menüsü
   "Ayarlar" oldu, yeni "Toplama" girişi eklendi (Metrikler raporlama olduğu için ayrılmadı —
   yeni bir düz sekme daha eklemek madde 1'in menü-sadeleştirme dersini bozardı).
6. **Toplama Ayarları — gerçek, ama dürüst kapsamla.** Yeni `admin/toplama` sayfası +
   `ingestion_settings` tablosu (`0012_ingestion_settings.sql`, `thesis_versions` deseniyle
   birebir: versiyonlu, tek aktif satır, rollback için eskiler durur). Araştırma (Explore ajanı)
   ile çekimin gerçek mimarisi çıkarıldı: `apps/worker/src/ingest.ts`'te kaynak başına limit
   HİÇ yoktu, sıklık iki ayrı statik yerde sabitti (`cron.ts`'in `CRON_SCHEDULE` env'i VE
   `.github/workflows/cron-tick.yml`'in YAML cron'u — ikisi de DB'den okunmuyor). Bu yüzden
   **yalnız gerçekten kontrol edilebilen iki kol** DB'ye bağlandı: kaynak başına üst sınır
   (`limitPerSource`, en yeni `posted_at`'e göre kırpar — yeni `apps/worker/src/lib/
   limit-per-source.ts`, 4 test) ve paralellik (`ingest.ts`'in sıralı for-loop'u
   `backfill-lens.ts`'teki sabit-boyutlu havuz desenine çevrildi — `Promise.all` + worker
   fonksiyonu). **Sıklık BİLİNÇLİ OLARAK DB'ye taşınmadı** — sahte bir "her X saatte" alanı
   eklemek, hiçbir şeyi değiştirmeyeceği için yanıltıcı olurdu; admin sayfasında bunun neden
   ve nerede sabit olduğu açıkça yazıyor. `/api/admin/ingestion-settings` `thesis`
   route'uyla birebir aynı iskelet (8 test).
7. **Ad bulma.** Kovala/İzle/Ele'nin ortak bir adı yoktu — artık **"Karar"** (`BandLegend`'a
   "Karar:" öneki eklendi, zaten `decisions` şemasında/kod genelinde kullanılan kelime,
   yeni bir jargon icat edilmedi). Çekim ayarları için "tarama" (artık UI özelliği) ve
   "kaynaklar" (Metrikler'de kaynak sağlığı) ile çakışmayan **"Toplama Ayarları"** seçildi.

**Temizlik:** `components/OpportunityCard.tsx` (artık hiçbir yerden import edilmiyor —
`DetailPanel`/`PanomCard`'a bölündü) silindi; ölü kod bırakılmadı.

**Doğrulama:** `pnpm typecheck` ve `pnpm -r test` (packages/core 61 + apps/worker 36 +
apps/web 97 = 194 test) yeşil. `browse` ile gerçek DB'ye karşı uçtan uca: Kuyruk'ta satır
tıklama → sağ panel anında değişiyor, karar verme → sayaçlar/liste tam sayfa yenilemeden
güncelleniyor, `/panom`'da karar izi + AI Yorumcusu doğru gösteriliyor, `/admin/toplama` her
iki alanı da kaydediyor (migration uygulanmadığı için "kaydedilemedi" — beklenen, aşağıya
bakınız) — üretilen tüm test kararları sonrasında service-role ile silindi, DB'de iz kalmadı.

**Bekleyen elle iş (değişmedi, yalnız listeye ikinci madde eklendi):**
`supabase/migrations/0011_item_tasks.sql` VE `0012_ingestion_settings.sql`'in ikisi de
Supabase Dashboard → SQL Editor'e elle uygulanması gerekiyor (önceki 11 migration'la aynı
sebep: yalnız REST API erişimi var, doğrudan Postgres bağlantısı/DDL yetkisi yok). Uygulanana
kadar görev ekleme ve toplama ayarı kaydetme temiz bir hata mesajıyla 500 döner, çökme olmaz.

## 14. Faz 5.4 düzeltmesi — gerçek 100vh kabuk + "Bloomberg terminal" görsel yönü (TAMAM, 2026-08-13)

Kullanıcı §13'ün sonucunu görünce "tasarım hâlâ istediğim gibi değil, sorular sor" dedi.
Sorular şunu ortaya çıkardı: **§13'teki split-pane aslında spesifikasyonu tam karşılamıyordu.**
Kullanıcının orijinal isteği ("sol alan, sağ alan olmalı, border line ile ayrılmalı, 100vh
olmalı — navbar değil") hem sol HEM sağ panelin navbar hariç kalan tüm yüksekliği kaplayıp
bağımsız kaymasıydı; §13'te yalnız SOL liste `sticky`/`max-h` ile sınırlanmıştı, sağ detay
paneli hâlâ normal sayfa akışında kayıyordu — gerçek bir app-shell değil, sadece "sticky
sidebar'lı bir sayfa"ydı. Kullanıcının "olmadı" demesi haklıydı.

1. **/design-shotgun ile 3 görsel yön üretildi.** `$D generate` (design binary) hiç
   yapılandırılmamış OpenAI anahtarı yüzünden anında başarısız oldu (3 paralel ajan da aynı
   hatayı verdi) — API anahtarı kurulumunu beklemek yerine gerçek Tailwind token'larıyla
   HTML/CSS mockup'lara geçildi (bu spesifik durumda AI-görsel üretiminden daha isabetli:
   piksel-doğru). Sekmeli tek bir karşılaştırma sayfası → Artifact olarak yayınlandı
   (`kuyruk-panom-shell-20260813`, gbrain taste-memory'ye `approved.json` ile kaydedildi):
   **A) Terminal Konsolu** (bloomberg-terminal, monospace, gri-öncelikli), **B) Kart Stüdyosu**
   (sıcak/editoryal, serif, gerçek gölge), **C) Sinyal Işıkları** (mevcut mor/eflatun markanın
   evrimi, bölgeli sağ panel). Üçü de aynı zorunlu yapıyı paylaşıyordu: navbar altında tam
   yükseklikte, dikey çizgiyle ayrılmış sol liste + sağ detay, her ikisi bağımsız kayan.
2. **Kullanıcı kararı: "C olsun fakat bloomberg-terminal hissi verilsin."** İki yön birleştirildi
   (aynı Artifact URL'sine yeniden yayınlandı, C sekmesi varsayılan): marka kimliği (gerçek
   `#7c3aed`/`#d946ef` mor-eflatun, gerçek `pursue`/`watch`/`kill` hex'leri) korunurken veri
   tipografisi monospace'e geçti, sıralar sıklaştırıldı, çizgi opaklığı artırıldı, parıltı
   geri çekildi.
3. **Gerçek uygulamaya işlendi — bu sefer spesifikasyona tam uyan app-shell:**
   - `app/queue/page.tsx`: `<main>` artık `flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden`
     — `mx-auto max-w-7xl px-6 py-8` kaldırıldı (kenardan kenara, ortalı-boşluklu DEĞİL).
   - `components/QueueBoard.tsx`: baştan yazıldı. Eski başlık+3-kutu+filtre-çubuğu+pill-satırı
     (~250px) tek, kaymayan bir üst şeride sıkıştırıldı (`shrink-0`, ~90px — kullanıcı: "sol ve
     sağdan margin çok fazla"). Altında `flex min-h-0 flex-1`: sol `w-[340px] overflow-y-auto
     border-r`, sağ `flex-1 overflow-y-auto` — ikisi de gerçekten bağımsız kayıyor (önceki
     versiyonda sağ panel kaymıyordu, sayfayla birlikte akıyordu). `browse` ile doğrulandı: sol
     listeyi sabit tutup sağ paneli 1900px kaydırdım, sol hiç kımıldamadı.
   - Tipografi: `card-visuals.tsx::FitRing`, `DetailPanel`, `QueueRow`, `PanomCard`,
     `TaskList`, `DecisionButtons`'taki veri metinleri (puan, bant etiketi, güven, meta,
     görev satırları, karar butonları) `font-mono` oldu — yalnız BU bileşenlerde (paylaşılan
     `border-hair`/`rounded-card` gibi global token'lar DEĞİŞMEDİ, etkisi yalnız Kuyruk/Panom'a
     kapsandı; Harita/Trend/Digest/admin sayfaları kasıtlı olarak dokunulmadı — Faz 5.2'de
     "zaten tutarlı" bulunmuştu, bu tur o değerlendirmeyi bozmuyor).
   - `QueueRow`: seçili satırda artık bandın kendi rengiyle sol kenar çubuğu (önceki sabit
     mor yerine — Kovala seçiliyse yeşil, İzle ise amber, doğru semantik).
   - `DetailPanel`/`PanomCard` kartları: `rounded-card`(16px)/`border-hair` yerine yerel
     `rounded-lg`/`border-white/[0.14]` — daha keskin, daha net çizgi (yalnız bu iki bileşende).
   - `app/queue/loading.tsx`: jenerik `PageSkeleton` (ortalı/padli) yeni kenardan-kenara
     kabukla uyuşmuyordu — kendi iskeleti yazıldı (aynı sabit yükseklik + sol liste taslağı).
4. **Doğrulama:** `pnpm typecheck` + `pnpm -r test` (194 test) yeşil. `browse` ile gerçek
   DB'ye karşı: sayfa yükleniyor, sol/sağ bağımsız kayıyor, satır tıklama anında panel
   değiştiriyor, `1` tuşu/tıklamayla Kovala kararı gerçek DB'ye yazılıp temizlendi, Panom
   kartında yeni karar izi + görev kutusu doğru görünüyor — konsol hatasız.

**Bilinçli kapsam dışı:** mobil/dar ekran için Kuyruk'un iki-panel düzeni şu an ayrı bir
responsive fallback'e sahip değil (önceki versiyonda `lg:` breakpoint'i vardı, bu tur
kaldırıldı — düzeltme masaüstü app-shell hissini önceliklendirdi). Kullanıcının isteği
tamamen masaüstü terimleriyle çerçevelenmişti ("email client/Linear-style"); mobil kullanım
sinyali gelirse ayrı ele alınır.

## 15. Faz 5.5 — Sohbet-uygulaması mimarisi (ChatGPT/Gemini/Claude deseni) (TAMAM, 2026-08-13)

Kullanıcı: "chatgpt, gemini, claude gibi ai sitelerinde kullanılan mimariye geçiyoruz — sol
navbar mesajlar yerine fırsatlar, sağ tarafta fırsat, input alanı yorum bırakma, input
alanında AI yorumu seçeneği olacak, y-scroll sadece kısımlarda olacak ama şık olacak, ana
navbar nasıl olur bilmiyoruz." §14'teki app-shell zaten doğru temeldi (sol liste + sağ panel,
ikisi bağımsız kayan) — bu tur sağ paneli gerçek bir sohbet-akışı düzenine çevirdi.

1. **Sağ panel artık üç sabit bölge:** (a) kaymayan bağlam başlığı — fit halkası + başlık +
   meta, sağ üstte karar butonları, altta bant/güven/bench/durum etiketleri + "Atla" (varsa);
   sürükleme YALNIZ bu başlığa bağlı (`SwipeCard` artık akışı değil başlığı sarıyor —
   önceki tasarımda tüm kart sürüklenebilirdi, bu da metin seçimini/kaydırmayı sürükleme
   sanardı; artık yalnız küçük sabit başlıkta risk var). (b) kayan mesaj akışı — AI analizi
   tek "mesaj" kartı olarak (özet, gerekçe, riskler, doğrulama görevleri), altında görev
   listesi kutusu, altında yorumlar `CommentFeed` ile gerçek sohbet balonu olarak (avatar
   baş harfi + isim + tarih + balon), altında (admin) AI Yorumcusu turları `DebateFeed` ile.
   (c) kaymayan alt composer — yorum girişi + "Gönder" + admin'e "✨ AI yorumu" tetikleyicisi
   (eskiden akışın ortasında duran ayrı "AI Yorumcusu başlat" butonunun yerini aldı).
2. **Hook ayrıştırması — mantık/görünüm ayrıldı, Panom bozulmadı.** `Comments.tsx`:
   `useComments()` (veri+ekleme) + `CommentList` (sade liste, Panom kullanıyor) + `Comments`
   (kendi kendine yeten sarmalayıcı, değişmedi — Panom hâlâ bunu kullanıyor) + yeni
   `CommentFeed.tsx` (sohbet-balonu görünümü, yalnız `DetailPanel`). Aynı desen
   `DebateRoom.tsx`'te: `useDebate()` (veri+tetikleme) + `DebateFeed` (akış görünümü,
   tetikleyici yok) + `DebateRoom` (kendi kendine yeten, Panom değişmedi). İki bileşen de
   composer'ın giriş/tetikleyicisini akıştaki sonuçtan ayırmayı GEREKTİRİYORDU — mantığı
   iki kere yazmak yerine hook'a çıkarıldı.
3. **`app/queue/page.tsx` / `QueueBoard.tsx`:** sağ panelin sarmalayıcısı `overflow-y-auto`
   + `mx-auto max-w-2xl px-6 py-6` idi — `DetailPanel` artık kendi iç düzenini (sabit
   başlık/kayan akış/sabit composer) yönettiği için sarmalayıcı `overflow-hidden`'a
   düşürüldü, iç padding kaldırıldı (genişlik `DetailPanel` içinde bölge bölge yönetiliyor:
   başlık/composer tam genişlik, akış içeriği `mx-auto max-w-2xl`).
4. **Ana navbar bilinçli olarak DEĞİŞMEDİ.** Kullanıcı "bilmiyoruz" dedi, karar bana
   bırakıldı: ChatGPT/Claude'un minimal üst çubuğu (yalnız oturum/model seçici) buradaki
   üst navbar'ın taşıdığı Panom/Raporlar/Ayarlar gezinmesini kaldırıp sol kenar çubuğuna
   taşımayı gerektirirdi — bu da her sayfada (Harita/Trend/Digest/admin) paylaşılan
   `Navbar` desenini bozar. Kapsam yalnız Kuyruk'un kendi iç mimarisiydi, uygulama-geneli
   gezinme modelini değiştirmek ayrı ve çok daha büyük bir karar — istenmedi, yapılmadı.
5. **Doğrulama:** `pnpm typecheck` + `pnpm -r test` (194 test) yeşil. `browse` ile gerçek
   DB'ye karşı uçtan uca: composer'dan yorum yazıldı → gerçek `POST /api/comments` → akışta
   anında sohbet balonu olarak göründü (test yorumu sonra service-role ile silindi); sabit
   akış bölgesi 300px kaydırıldı, başlık/composer/sol liste hiç kımıldamadı; Panom hâlâ
   konsol hatasız (hook ayrıştırması geriye dönük kırmadı).

**Ek düzeltme (aynı gün): üst şerit sadeleştirildi.** Kullanıcı: "filtreler karmaşa
çıkarıyor ama lazımlar, header genele uymuyor, diğer yerler de sade olabilir." Eski üst
şerit her zaman açık 13+ kontrol gösteriyordu (başlık+3 sayaç+metin+arama+4 seçici+sıralama+
6 pill, iki satır ~90px). `QueueBoard.tsx`: varsayılan görünüm artık tek satır — başlık,
sayaçlar, "⚡ Kararsızlar" (sık kullanılan asıl anahtar, açıkta kaldı), arama, sonuç sayısı,
tek "⚙ Filtrele" düğmesi (aktif filtre sayısı rozetle: `Filtrele (2)`). Sektör/Pazar/Kaynak/
Sıralama/Bench/aktivite pill'leri artık yalnız "Filtrele" açıldığında görünen ikinci satırda
— aktif filtre varsa "Temizle" linki de orada çıkıyor. İşlevsellik hiç azalmadı (kullanıcı:
"lazımlar"), yalnız varsayılan görünüm sadeleşti. `lensSummary` prop'u (statik "Arbitraj +
Beyaz-alan" metni, gürültüye katkısı vardı) `QueueBoard`/`queue/page.tsx`'ten kaldırıldı.
`browse` ile doğrulandı: kapalıyken tek satır, "Filtrele"ye tıklayınca ikinci satır açılıp
tüm kontroller çalışıyor, konsol hatasız.

**Hemen ardından ikinci düzeltme (aynı gün): paylaşılan üst şerit tamamen kaldırıldı.**
Kullanıcı "header genele uymuyor" ile neyi kastettiğini netleştirdi: "Fırsat Kuyruğu
alanını sol alanın içine al, header navbarı kaldır ama sola dahil et, sağ alanı tam
yüksekliğe kavuştur." Yukarıdaki düzeltme hâlâ iki panelin ÜSTÜNDE paylaşılan tek bir şerit
bırakıyordu (ChatGPT/Claude'da böyle bir şey yok — kenar çubuğunun kendi üstü var, ana alan
baştan sona kendi). `QueueBoard.tsx` tekrar yazıldı: artık paylaşılan şerit yok, sol panel
`flex flex-col` (kendi başlığı+arama+kararsızlar/filtrele+liste, hepsi 340px genişliğe göre
dikey istiflendi — filtre `select`leri artık `grid grid-cols-2`), sağ panel (`DetailPanel`)
doğrudan `h-full` — navbar hariç TÜM yüksekliği kendi başına kaplıyor, üstünde başka hiçbir
şerit yok. `browse` ile doğrulandı: sol panelin kendi başlığı var, sağ panel navbar'ın hemen
altından başlayıp tam yüksekliğe kadar iniyor, filtreler dar sütunda 2 sütunlu ızgarada
düzgün sığıyor, konsol hatasız.

**Üçüncü ve son düzeltme (aynı gün): üst yatay navbar TAMAMEN kaldırıldı, uygulama geneli.**
Kullanıcı: "IDEAFACT / Kuyruk / Panom / Raporlar / Ayarlar / Muhammed / Çıkış bu alan ayrıca
kalmasın sol alana dahil edilsin" — yani `components/Navbar.tsx` (tüm sayfaların üstünde,
yatay) tamamen kaldırılıp içeriği sol kenar çubuğuna taşınacaktı. Bu, Kuyruk'un ötesinde
UYGULAMA GENELİ bir değişiklik (Navbar 9 sayfada paylaşılıyordu) — kullanıcı bunu önceki
turda "söylersen yaparım" notuyla zaten onaylamıştı, bu turda gerçekten söyledi.

1. **Yeni `components/AppSidebar.tsx`** — `Navbar`'ın yerini alan, dikey/tam-yükseklik kenar
   çubuğu: logo, Kuyruk/Panom düz linkler, "Raporlar" bölüm etiketi + Harita/Trend/Digest,
   "Ayarlar" bölüm etiketi (admin-only) + Tez/Mercekler/Toplama/Metrikler, esnek `children`
   yuvası (nav ile hesap-bilgisi arasında, varsayılan boş), sabit altta hesap satırı
   (avatar+isim+Çıkış). Genişlik prop'la ayarlanabilir (varsayılan 200px).
2. **Kullanıcının hemen ardından gelen ikinci düzeltmesi: "sol alan menü VE fırsatları
   birlikte barındıracak."** İlk halde `AppSidebar` (nav, 200px) Kuyruk'un kendi liste
   panelinin (340px) YANINDA ayrı bir sütundu — üç sütun (nav+liste+detay). Kullanıcı
   ChatGPT/Claude/ Gemini referans görsellerini gösterip (fetch edilip incelendi — üçü de
   aynı deseni doğruladı: TEK kenar çubuğu, nav+sohbet-listesi+hesap-bilgisi hepsi birlikte,
   ana alanda paylaşılan şerit yok) bunun yanlış olduğunu netleştirdi. Düzeltme: `AppSidebar`
   `children` alacak şekilde genişletildi; `QueueBoard.tsx` artık kendi başlık/arama/filtre/
   liste bloğunu `<AppSidebar me={me} current="queue" width={300}>{...}</AppSidebar>`
   içine `children` olarak veriyor — nav sabit üstte, Kuyruk'un listesi kendi kaydırmasıyla
   ortada, hesap bilgisi sabit altta, HEPSİ TEK sütun. `QueueBoard` artık `me`/`demo` prop'u
   da alıyor (demo banner artık sağ panelin üstünde, sol kenar çubuğunu etkilemiyor).
3. **Diğer 8 sayfa** (`panom`, `harita`, `trend`, `digest`, `admin/tez`, `admin/mercekler`,
   `admin/toplama`, `admin/metrikler`) — hepsi aynı dönüşüm: `<Navbar/>` + ayrı `<main>` →
   `<div className="flex h-screen overflow-hidden"><AppSidebar .../><main className="min-w-0
   flex-1 overflow-y-auto">...</main></div>`. `/login` DOKUNULMADI — zaten `Navbar`
   kullanmıyordu, kenar çubuğu da almıyor (oturum yok, gezinecek bir şey yok).
4. **Temizlik:** `components/Navbar.tsx` ve `components/NavDropdown.tsx` (artık hiçbir yerden
   import edilmiyor — grep ile doğrulandı) silindi. `components/PageSkeleton.tsx`:
   `NavbarSkeleton` → `SidebarSkeleton` (kenar çubuğu şeklinde iskelet), `queue/loading.tsx`
   yeni kabuğa göre güncellendi.
5. **Doğrulama:** `pnpm typecheck` + `pnpm -r test` (194 test) yeşil. Dev server tam temiz
   restart edildi (`.next` silindi) — ara adımlardaki eski webpack/konsol hataları kalıcı
   DEĞİLDİ, temiz restart + konsol temizleme sonrası tüm sayfalar (`/queue`, `/panom`,
   `/harita`, `/admin/toplama`) `browse` ile hatasız yüklendi. Kuyruk'ta artık: sol TEK
   kenar çubuğunda nav+arama+filtre+liste+hesap hepsi bir arada, sağ panel navbar'sız
   baştan sona tam yükseklik — üç referans görselle (ChatGPT/Claude/Gemini) doğrudan
   karşılaştırılıp yapısal olarak eşleştiği teyit edildi.

## 16. Faz 5.10 — kenar çubuğu menüsü inline'a taşındı + Kuyruk liste sınırı + kaydırma solması (TAMAM, 2026-08-13)

Not: §15'ten sonra kod tarafında (bu tur öncesi) zaten Faz 5.6-5.9 kadar ilerlemişti —
tek-genişlik kenar çubuğu + küçült/büyüt anahtarı + Ayarlar dişlisiyle açılan yüzen
Raporlar/Ayarlar paneli (`components/AppSidebar.tsx`'teki JSDoc'ta izleri var) — ama o
aralık PLAN.md'ye hiç yazılmamış (dokümantasyon boşluğu, geriye dönük doldurulmadı, kapsam
dışı). Bu madde yalnız BU turun değişikliğini kayıt altına alıyor.

Kullanıcı: "kuyruk ve panom'un altında daha fazla ekle (ikonu vb olsun), açılır kapanır
olmalı yeni menü eklersek buraya ekleriz, ayrıca buna göre kaç adet fırsat listelenecek
düzenle." İki açık soru soruldu (AskUserQuestion — [[feedback-explain-before-big-decisions]]
kapsamında, tasarım kararı): (1) yeni menü bölümü varsayılan açık mı kapalı mı — **kapalı**
seçildi, (2) liste sınırlama yöntemi — **ilk 50 + "daha fazla yükle"** seçildi. Sonrasında
kullanıcı: "pipeline'a al, ayrıca meta pipeline'a al sürekli bana sorma" — bu noktadan sonra
(fade efekti dahil) soru sorulmadan yürütüldü.

1. **Ayarlar dişlisiyle açılan yüzen panel kaldırıldı.** `AppSidebar.tsx`: Raporlar
   (Harita/Trend/Digest) + Ayarlar (admin-only: Tez/Mercekler/Toplama/Metrikler) artık
   Kuyruk/Panom'un hemen altında, kendi ikonlarıyla (`icons.tsx`'e eklendi:
   `IconChevronDown`, `IconFileText`, `IconAperture`, `IconDownload`, `IconBarChart` —
   Harita/Trend/Digest zaten var olan `IconGlobe`/`IconTrendingUp`/`IconMessage`'ı
   kullanıyor), "Daha fazla" başlığıyla katlanır-açılır bir bölüm olarak nav akışının
   içinde duruyor — ileride yeni bir menü eklenirse buraya eklenir. Varsayılan kapalı,
   tercih `localStorage`'ta kalıcı (`idea-factory:sidebar-more-open`); yalnız o an bir
   Raporlar/Ayarlar sayfasındaysak (aktif sekme görünür kalsın diye) açık başlıyor.
   Eski dışa-tıklayınca-kapanan yüzen panel + gear butonu (`menuOpen`/`menuWrapRef`)
   tamamen kaldırıldı.
2. **Kuyruk listesi artık sayfalanıyor.** Kenar çubuğu kalıcı yer kapladığı için (menü +
   liste aynı sütunda) `QueueBoard.tsx`: `filtered` (885'e kadar) yerine `visible =
   filtered.slice(0, visibleCount)` render ediliyor, `visibleCount` `PAGE_SIZE=50`'den
   başlıyor, filtre/arama/sıralama değişince ilk sayfaya dönüyor (`useEffect`). Liste
   sonunda "Daha fazla yükle (N tane daha)" butonu `visibleCount`'u 50 artırıyor. `selected`
   hâlâ tüm `filtered`e bakıyor (yalnız `visible`e değil) — sıralama zaten en üsttekini
   önceliklendirdiği için oto-ilerleme/seçim davranışı bozulmadı.
3. **Fırsat kartını incelerken üst/alt sabit barlara doğru yumuşak kaybolma.** Kullanıcı
   isteği: "kovala izle ele (alt navbar'a doğru) yumuşuyarak kaybolma ekle, aynısını yukarı
   navbar için de ekle." `DetailPanel.tsx`'in kayan mesaj akışına (üst bağlam başlığı ile
   alt karar barı arasındaki `overflow-y-auto` bölge) `mask-image`/`-webkit-mask-image`
   ile 20px'lik lineer gradyan fade eklendi — kaydırılan içerik üst başlığa/alt karar
   barına sert bir çizgide kesilmek yerine her iki uçtan da yumuşak solarak kayboluyor.
4. **Bant sayaçları tıklanabilir filtreye dönüştü.** Kullanıcı: "filtrelere kırmızı - sarı -
   yeşil daire ekle (sadece bunlara basarak filtreleme yapılabilsin)." Eski davranış yalnız
   hover'da açılan salt-okunur bir dökümdü (üç renkli nokta + sayı, tıklanamaz). `QueueBoard.tsx`:
   `bandFilter: Set<Band>` state'i eklendi, üç nokta artık her zaman görünür ve tıklanabilir
   buton (`toggleBand` — çoklu seçim: Kovala+İzle birlikte seçilebilir, boş küme = hepsi).
   Aktif bant `card-visuals.tsx::BAND` paletinin hex'iyle (inline `boxShadow`) ve metin
   rengiyle vurgulanıyor. `activeFilterCount`/`clearFilters` bant filtresini de kapsıyor
   (Filtrele rozetinde sayılıyor, Temizle'de sıfırlanıyor). Ayrı bir "Yönetim" yeniden adı
   yanlışlıkla §16 madde 1'e sızmıştı (kod zaten "Ayarlar" kullanıyordu — bu turun kendi
   dokümantasyon hatası) — kullanıcı fark edip düzeltti, hem component hem PLAN.md metni
   "Ayarlar"a geri alındı.
5. **Doğrulama:** `tsc --noEmit` temiz, `pnpm -r test` (194 test) yeşil. `browse` ile gerçek
   DB'ye karşı (geçici `AUTH_SECRET`-imzalı test JWT'siyle, iş bitince çerez temizlendi):
   "Daha fazla" kapalı başlıyor, tıklanınca Raporlar/Ayarlar ikonlarıyla açılıyor; Kuyruk
   listesi ilk 50'yi gösterip "Daha fazla yükle (835 tane daha)" ile kalanı katıyor;
   `mask-image` computed CSS'te doğrulandı ve kırpılmış ekran görüntüsünde görünür fade
   teyit edildi; yeşil (Kovala) noktaya tıklayınca liste 885'ten 52'ye düştü, "Filtrele (1)"
   rozeti çıktı, tekrar tıklayınca tamamen geri açıldı; konsol hatasız. (Not: doğrulama
   sırasında `browse` daemon'ı iki kez kendiliğinden yeniden başladı — dev sunucusunun Fast
   Refresh'i ile ilgisiz, `browse`'un kendi tarayıcı süreci sorunuydu; yeniden bağlanınca
   sorunsuz devam etti, uygulama tarafında bir etkisi yok.)
6. **"Daha fazla" (Raporlar/Ayarlar) hesap satırının yanına taşındı.** Kullanıcı: "ayarları
   tekrar çıkışın yanına taşı" — madde 1'de Kuyruk/Panom'un hemen altına konmuştu, kullanıcı
   bunu istemedi. `AppSidebar.tsx`: toggle + genişleyen liste artık `{children}` (Kuyruk'un
   listesi) alanının ALTINDA, hesap satırının/Çıkış'ın hemen üstünde — kendi `border-t`
   ayracıyla. Hesap satırının kendi üst çizgisi yalnız `collapsed` (64px ikon rayı) modunda
   kalıyor (o zaman "Daha fazla" hiç render edilmiyor, tek ayraç hesap satırınınki olmalı);
   genişken çift çizgi görünmesin diye hesap satırının `border-t`'si kaldırılıp `mt-2 pt-1`
   ile küçük bir boşluğa indirildi. İkonlar/varsayılan-kapalı/localStorage davranışı
   değişmedi, yalnız konum taşındı.
7. **AI Yorumcusu sonucu artık diğer yorumlarla aynı sohbet balonu.** Kullanıcı: "yapay
   zekanın yorumu da diğer yorumlar gibi gözüksün istersen detay alınabilsin (genişletilebilir
   olsun) ve transkript okunabilir olsun." `DebateRoom.tsx::DebateTranscript` baştan yazıldı:
   eski `rounded-btn border bg-canvas/40` kutusu yerine `CommentFeed` ile birebir aynı iskelet
   (avatar + isim + tarih + balon) — avatar kişi baş harfi yerine (yapay zeka olduğunu ayırt
   etsin diye) mor-eflatun gradyanlı `IconSparkle` dairesi, isim "AI Yorumcusu", yanında renkli
   karar rozeti (KOVALA/İZLE/ELE) ve tarih, altında küçük "{kullanıcı} başlattı" satırı, balon
   içinde `final_commentary`. Tam transkript (tur tur gerekçe/kanıt, `TurnCard`) varsayılan
   gizli — "Tartışmanın tamamını gör — N tur ▾" ile genişliyor (eski "transkript ▾" belirsiz
   etiketinden daha açık). `TurnCard` içindeki mesaj/kanıt metinleri okunabilirlik için
   `text-[10px]/text-xs` → `text-xs/text-sm`'e büyütüldü. `DebateFeed`'in balonlar arası
   boşluğu `CommentFeed` ile tutarlı olsun diye `space-y-2` → `space-y-3`.
8. **Doğrulama (madde 6-7):** `tsc --noEmit` temiz, `pnpm -r test` (194 test) yeşil. `browse`
   ile gerçek DB'ye karşı: "Daha fazla" artık Test Admin hesap satırının hemen üstünde,
   Kuyruk listesinin altında; AI Yorumcusu balonu "muhammed" yorumunun hemen altında aynı
   görünümde, "Tartışmanın tamamını gör" tıklanınca "İyimser Kurucu" turu (KOVALA rozeti,
   tam gerekçe metni) okunaklı biçimde açıldı; konsol hatasız.

## 17. Faz 5.11 düzeltmesi — Ayarlar tekrar eski yerine + gerçek yorum/tartışma bug'ı (TAMAM, 2026-08-13)

Kullanıcı §16 madde 6'yı beğenmedi: "ayarları tekrar çıkışın yanına taşı" derken kastı §13
Faz 5.4'ün "Raporlar VE Ayarlar birlikte tek 'Daha fazla' bölümü, Kuyruk listesinin altında"
kararı değil, çok daha eski Faz 5.8 deseniydi (gerçek gear-ikon → hesap satırının ÜSTÜNDE
yüzen panel, hesap satırının İÇİNDE, Çıkış'ın hemen solunda). Aynı mesajda ikinci, tamamen
ayrı bir gerçek bug da bildirdi: "yorumlar gözükmüyor her sayfada aynı yorum gözüküyor."
Kullanıcı: "sürekli bana soru sorma, pipeline'a al" — ikisi de sormadan çözüldü.

1. **Ayarlar/Raporlar ayrıştırıldı.** `AppSidebar.tsx`: **Raporlar** (Harita/Trend/Digest)
   "Daha fazla" adıyla Kuyruk/Panom'un hemen altında kalmaya devam ediyor (§16'daki ikonlu/
   katlanır tasarım korundu, yalnız artık Ayarlar'ı İÇERMİYOR). **Ayarlar** (admin-only:
   Tez/Mercekler/Toplama/Metrikler) Faz 5.8'in orijinal deseniyle geri geldi: hesap
   satırında `IconSliders` dişli ikonu — `me.display_name`/avatar ile `LogoutButton`
   arasında, yani Çıkış'ın solunda — tıklanınca hesap satırının ÜSTÜNDE yüzen bir panel
   açılıyor (`adminOpen` state + `adminWrapRef` ile dışına-tıklayınca-kapanma, §13'teki eski
   `menuWrapRef` deseniyle birebir). Kenar çubuğu daraltılırken (`toggleCollapsed`) panel de
   kapanıyor (eski davranış). `REPORT_KEYS`/`ADMIN_KEYS` artık birleşik `MENU_KEYS` olmadan
   ayrı ayrı "aktif sekme" vurgusu için kullanılıyor.
2. **Gerçek bug: yorumlar/AI Yorumcusu turları sinyaller arasında sızıyordu.**
   `components/Comments.tsx::useComments` ve `components/DebateRoom.tsx::useDebate` ikisi de
   `useState(initial)` kullanıyordu — bu yalnız İLK mount'ta state'e giriyor. `DetailPanel`
   Kuyruk'ta başka bir sinyal seçilince YENİDEN MOUNT OLMUYOR (yalnız `item` prop'u değişiyor,
   `QueueBoard` `<DetailPanel>`'e `key={item.id}` VERMİYOR — `DetailPanel`'in içindeki
   `key={item.id}` yalnız kök `div`i etkiliyor, `useComments`/`useDebate` çağrıları
   `DetailPanel`'in kendi gövdesinde, o `div`in DIŞINDA). Sonuç: kullanıcı Kuyruk'ta farklı
   bir sinyale tıkladığında yorum/tartışma state'i SIFIRLANMIYOR, ilk açılan sinyalin
   yorumları her yerde görünmeye devam ediyordu. Düzeltme: her iki hook'a da
   `useEffect(() => setItems/setDebates(initial), [signalId])` eklendi — kasıtlı olarak
   yalnız `signalId`'ye bağlı, `initial`'a DEĞİL (üst bileşen aynı sinyal için yeni bir array
   referansı üretirse az önce eklenen lokal yorumu/tartışmayı silmesin diye).
3. **Doğrulama:** `tsc --noEmit` temiz, `pnpm -r test` (194 test) yeşil. `browse` ile gerçek
   DB'ye karşı: Ayarlar dişlisi Test Admin satırında Çıkış'ın solunda, tıklanınca panel hesap
   satırının üstünde açılıyor (Tez/Mercekler/Toplama/Metrikler ikonlarıyla); "Daha fazla"
   tekrar Kuyruk/Panom'un altında. Bug doğrulaması: ilk sinyalde "muhammed" yorumu + bir AI
   Yorumcusu turu görünüyordu, ikinci bir sinyale (Replit'in CEO'su) geçilince tamamen farklı
   bir AI Yorumcusu yorumu (13.08.2026 tarihli, ayrı gerekçeyle) göründü — ilk sinyale geri
   dönülünce orijinal içerik doğru şekilde geri geldi; konsol hatasız.
4. **AI Yorumcusu'nun sonucu "ekip" satırına da işleniyor.** Kullanıcı: "yapay zekadan çıkan
   sonuçta ekip kısmına kaydedilsin." Karar butonlarının altındaki "ekip: {üye}: {karar}"
   satırı (`DecisionButtons.tsx`, `others: UserDecision[]`) yalnız gerçek kullanıcı
   kararlarını gösteriyordu. `DetailPanel.tsx`: en son AI Yorumcusu turunun (`debate.debates[0]`
   — en yeni öne ekleniyor) `final_verdict`'i "AI Yorumcusu" adıyla senteze `others`'a
   EKLENİYOR (`teamWithAi`) — yalnız görüntüleme amaçlı birleştirme, `item.others` (gerçek
   veri) DEĞİŞMİYOR, başka hiçbir yerde (aktivite filtresi, Panom vb.) etkisi yok. Tartışma
   hiç başlatılmamışsa veya kullanıcı admin değilse (`item.debates` zaten boş dizi geliyor)
   hiçbir şey eklenmiyor — veri sızıntısı riski yok. `browse` ile doğrulandı: "ekip: muhammed:
   İzle · AI Yorumcusu: Ele" iki farklı renkte (amber/kırmızı) doğru göründü, `tsc --noEmit`
   temiz, konsol hatasız.
5. **Daraltılmış rayda hizalama + Raporlar sayfaları görünür oldu.** Kullanıcı iki küçük
   bulgu bildirdi: (1) "sol navbar küçültülünce ideafact mor dairesi hizalı durmuyor" —
   logo satırı `justify-between` kullanıyordu, daraltılmışken tek çocuk (nokta, IDEAFACT
   metni gizli) kaldığı için sola yaslanıyordu, alttaki ikonlar (`place-items-center`/
   `self-center`) ise ortalıydı. Düzeltme: `collapsed` iken satır `justify-center`'a
   geçiyor. (2) "navbarı küçültünce sol navbarda daha fazladaki sayfalar gözüksün" —
   Raporlar (Harita/Trend/Digest) daraltılmış rayda tamamen gizliydi (`!collapsed &&
   moreOpen` şartı). Daraltılmış rayda "katlanır/açılır" kavramının zaten anlamı yok
   (metin hiç gösterilmiyor) — üç ikon artık Kuyruk/Panom gibi rayda HER ZAMAN görünüyor
   (`(collapsed || moreOpen) &&` + `collapsed`/`label` prop'ları eklendi), yalnız genişkenki
   açılır/kapanır davranış korunuyor. Ayrıca "daha fazla yükle" madde 16.1'in zaten +50/tık
   yaptığı `browse` ile sayı sayılarak doğrulandı (50→100→150) — kod değişikliği gerekmedi,
   yalnız teyit edildi. `tsc --noEmit` temiz, `pnpm -r test` (194 test) yeşil, konsol hatasız.
6. **Kenar çubuğu ile üst/alt barlar arasında renk/saydamlık tutarlılığı.** Kullanıcı: "sol
   navbar, üst navbar ve alt navbar arasında renk veya saydamlık eşitliği olsa çok güzel
   olur." `AppSidebar.tsx`'in kök `div`inde arka plan sınıfı YOKTU — sayfanın `body`
   arka planı (mor radyal glow'lu `#0a0a0f` gradyan) şeffaf olarak sızıyordu, oysa
   `DetailPanel`'in üst bağlam başlığı ve alt karar barı ikisi de düz `bg-surface`
   (`#151320`) kullanıyordu — üç şerit arasında görsel uyumsuzluk vardı. Tek satırlık
   düzeltme: kenar çubuğunun kök `div`ine de `bg-surface` eklendi — artık üçü aynı düz
   tonda, yalnız ortadaki kaydırılan içerik alanları (mesaj akışı, Kuyruk listesi) kasıtlı
   olarak canvas/gradyan arka planı koruyor (BRANDING.md §8'deki "sabit kroma vs. kayan
   içerik" ayrımı).
7. **Filtreler paneli UI/UX'i geliştirildi.** Kullanıcı: "filtreler kısmı ui/ux açısından
   geliştirilsin." Üç somut sorun tespit edilip düzeltildi: (1) panel kapalıyken hangi
   filtrelerin aktif olduğu hiç görünmüyordu, tek bir filtreyi kaldırmak için paneli açıp
   select'i "Tümü"ye geri almak gerekiyordu — panel kapalıyken de görünen, kaldırılabilir
   "×" çipleri eklendi (`activeChips`, Sektör/Pazar/Kaynak/Aktivite/Kararsızlar/Bench için).
   (2) panel içi 6 kontrol tek bir `grid-cols-2` yığınına sıkışmıştı, tarama zor — "Filtreler"
   başlığı + "Tümünü temizle" satırı ve dört mikro-bölüm etiketiyle (KAPSAM/AKTİVİTE/HIZLI
   FİLTRELER/SIRALA) gruplandı, Sırala ayrı bir bölüme (üstte çizgiyle ayrılmış) alındı —
   sıralama bir filtre değil görünüm tercihi olduğu için kavramsal olarak ayrıştırıldı.
   (3) filtre ikonunun yanındaki çıplak sayı, marka rengiyle dolgulu yuvarlak bir rozete
   dönüştürüldü (daha tanıdık/okunur bir bildirim-sayacı deseni). Bant noktaları (kırmızı/
   sarı/yeşil, önceki turda eklendi) kasıtlı olarak çip satırına eklenmedi — zaten kendi
   halka vurgusuyla her zaman görünürler, tekrar göstermek gürültü olurdu.
8. **Doğrulama (madde 6-7):** `tsc --noEmit` temiz, `pnpm -r test` (194 test) yeşil. `browse`
   ile gerçek DB'ye karşı: kenar çubuğu artık üst/alt barlarla aynı düz tonda; filtre paneli
   "KAPSAM/AKTİVİTE/HIZLI FİLTRELER/SIRALA" etiketleriyle net bölümlere ayrılmış görünüyor;
   "Kararsızlar" açılınca hem panel içinde hem panel kapatıldığında altta "Kararsızlar ×"
   çipi + "Temizle" linki + rozet "1" doğru göründü; çipteki "×"e tıklanınca yalnız o filtre
   kalkıp liste 885'e geri döndü; konsol hatasız.

Not: bu turdan sonra iki sürüm main'e landed ama PLAN.md'ye hiç işlenmedi — `v0.2.0`
(Faz 4 admin araçları + Faz 5 Kuyruk'un chat-app mimarisine geçişi, commit `75370cb`) ve
`v0.3.0` (Ayarlar tek sekmeli sayfa, mercek migrasyonu, çekim panel kontrolü, marka imzalı
alt bar, commit `4e9ec21`, 2026-08-15). Retroaktif doküman borcu — ayrı bir tur ister.

## 18. Kesinleşmiş karar + Panom kanban yeniden tasarımı (2026-08-15)

Kullanıcı beş somut ürün problemi tanımladı: (1) herkes fikir belirtiyor ama netice
belirlenmiyor, (2) bu yüzden fırsat ayırt edilemiyor, (3) adım atma yönü güçsüz, (4) Panom
genel yapı/tasarımla uymuyor — görsel/yapısal uyumsuzluk + sürükle-bırak kanban eksik +
kalabalık/kullanışamaz (AskUserQuestion, üçü de seçildi), (5) elenen/izlenen sinyaller
sonsuza kadar birikiyor, hiç arşivlenmiyor/geri gelmiyor.

**Kök neden analizi:** `decisions` bilinçli olarak kişi-başı paralel bir log (`load-
decisions.ts`) — hiçbir zaman "bu artık kesin karar" diyen tek bir alan yoktu. Panom da
yalnız İZLEYEN kullanıcının kendi kararına göre gruplanıyordu.

**Uygulanan çözüm:**
1. **`final_decisions` tablosu** (`0013_final_decisions.sql`, kullanıcı Supabase'e
   UYGULAMALI, henüz yapılmadı) — sinyal başına TEK "resmi/ekip" karar, kişisel
   `decisions`'tan ayrı. Kullanıcı kararı: **herhangi bir üye kilitleyebilir/açabilir**, admin
   kısıtı yok. `signals.watch_review_at` (izle kilitlenince +30 gün, başka banda geçince
   null) — Panom'un "Bugün gözden geçir" bloğu bunu okur (problem 5).
2. **`ranker.ts`**: `bandOverride` önceliği artık final > kişisel > AI bandı
   (`queue/page.tsx`); sort'a confidence tiebreak eklendi (band sonrası, tazelikten önce) —
   düşük güvenli "kovala" artık taze diye yüksek güvenlinin önüne geçemiyor (problem 2).
3. **Otomatik başlangıç görevleri**: "kovala" ilk kez seçilince (kişisel ya da kilitli) ve
   hiç görev yoksa 3 genel şablon görev eklenir (`task-templates.ts`) — boş checklist yerine
   düzenlenebilir bir başlangıç (problem 3). Mercek-özel şablon YOK (mercekler artık tamamen
   admin-dinamik).
4. **Panom tamamen kanban'a yeniden yazıldı** (`PanomBoard.tsx`/`PanomCard.tsx`): 3 sütun
   yan yana, native HTML5 sürükle-bırak (kütüphane eklenmedi — mevcut minimal dependency
   listesiyle tutarlı). Sürüklemek KİŞİSEL kararı yazar; ayrı bir "Kilitle" düğmesi ekip
   kararını KESİNLEŞTİRİR. Kilitli kartlar sürüklenemez (önce kilit açılmalı). Ele varsayılan
   katlı (yalnız sayı + "Göster"); İzle "Bugün gözden geçir" (watch_review_at geçmiş) üstte,
   geri kalanı katlı; her sütun `daha fazla yükle` ile sayfalanır (binlerce kart aynı anda
   DOM'a basılmıyor). Kart Kuyruk'un görsel diliyle (BAND renkleri, kompakt satır) uyumlu.
5. **Kuyruk'a da kilit görünürlüğü eklendi** (yalnız Panom'a hapsetmemek için): `QueueRow`'da
   kilit ikonu, `DetailPanel`'de "Kesinleşti: X (kim)" rozeti + kilitle/aç düğmesi (aynı
   `/api/decisions/final` uç noktası, Panom'la simetrik optimistic-update deseni).
6. **`/admin/metrikler`**: "Kesinleşmiş fırsat (kovala)" istatistik kutusu eklendi —
   AI'ın ham "pursue" sayısı değil, gerçekten kilitlenmiş sayı (problem 2).

**Doğrulama:** `tsc --noEmit` (core + web) temiz, `next build` (prod) temiz, `pnpm -r test`
210/210 yeşil (final/route.test.ts 12 yeni test + decisions/route.test.ts'e 3 + ranker.test.ts'e
1 confidence-tiebreak testi eklendi). `browse` ile izole demo modda (SUPABASE_URL boş, port
3101, gerçek DB'ye dokunulmadı) doğrulandı: Kuyruk'ta Kovala→Kilitle→Kilidi aç akışı uçtan uca
çalıştı (rozet/ikon/buton durumu doğru güncellendi, konsol hatasız), Panom boş durumu doğru
render edildi. Kanban'ın gerçek veri üzerindeki sürükle-bırak/sütun davranışı demo modda test
edilemedi (DB gerekiyor) — kod incelemesi + tip kontrolü + Kuyruk'ta doğrulanan aynı fetch
deseniyle güvence altına alındı.

**Durum (2026-08-18 doğrulandı):** `0013_final_decisions.sql` ve `0010_digests.sql` ikisi de
Supabase'e UYGULANMIŞ (REST API ile doğrulandı, digests dolu). Kilitle/kilit-aç akışı gerçek
Supabase'e ve gerçek `muhammed` hesabına karşı canlı test edildi (`/browse`): bir sinyal
kilitlenip `final_decisions`'a satır yazıldığı, sonra kilit açılıp satırın silindiği REST
sorgusuyla doğrulandı, UI baştan sona doğru güncellendi. Test edilmeyen tek parça: kanban'ın
kendi sürükle-bırak (HTML5 DnD) etkileşimi — buton yoluyla aynı uç noktaya (`/api/decisions/
final`) gidildiği doğrulandı, ama drag event'lerinin kendisi denenmedi.

## 19. Tek "etkin bant" hiyerarşisi — Kuyruk/Panom'da 3 ayrı çelişen mantık birleştirildi (2026-08-19)

Kullanıcı bulgusu: "sistemin otomatik analizi (Kovala vb), AI tartışma odası ve kullanıcıların
sonuçları hepsi farklı, nasıl bütünleştirilmeli?" Kod taramasıyla doğrulandı — üç ayrı,
birbirinden habersiz "kim kazanır" mantığı vardı: Panom'un sütun gruplaması (`final ?? mine`),
Kuyruk'un sıralaması (`final ?? mine`, yoksa ham AI bandı), ve görünen büyük rozet/nokta rengi
(HER ZAMAN ham AI kompozit bandı — kararların hiç etkisi yoktu). AI Yorumcusu (tartışma odası)
hiçbir yerde işlevsel değildi, yalnız "Yorumcu: X" etiketiydi.

**Uygulanan tek hiyerarşi** (`apps/web/lib/card-view.ts::resolveEffectiveBand`, 5 test):
**Kesinleşmiş (kilitli) > Kişisel karar > AI Yorumcusu (tartışma yapıldıysa) > AI kompozit
bandı.** AI Yorumcusu admin-only veri olduğu için (`load-debates.ts`) bu katman admin
olmayanlarda doğal olarak atlanır. Yeni `CardView.effectiveBand` alanı sunucuda
(`build-card-view.ts`) tek yerde hesaplanır; `QueueRow` (nokta/kenar rengi), `DetailPanel`
(üst rozet + FitRing — artık "AI: X · Sen: Y · Yorumcu: Z" dökümüyle birlikte), `QueueBoard`
(sayaçlar/filtre/"bant" sıralaması, karar verilince ANINDA — sayfa yenilenmeden — yeniden
hesaplanır) hepsi bunu kullanıyor. `queue/page.tsx`'in sunucu sıralaması da AI Yorumcusu
katmanını içerecek şekilde genişletildi. **Panom'un kendi `final ?? mine` mantığına
dokunulmadı** — bilinçli: Panom'un üyelik filtresi zaten final/mine'dan birini garanti eder,
AI Yorumcusu/ham banda hiç düşülmez (Panom = "ne karar verdik", Kuyruk = "sistem şu an ne
düşünüyor"). Harita/trend/metrics.ts'in ham `composite().band` kullanımına kasıtlı
dokunulmadı — onlar AI'ın kendi ham görüşünü haritalıyor, karar-ayarlı görünüm değil.

Doğrulama: `tsc --noEmit` + `pnpm -r test` (117/117 web) yeşil, gerçek Supabase'e karşı canlı
test edildi (`/browse`, muhammed hesabı) — Kuyruk'ta İzle işaretlenince üst rozet/nokta/sayaçlar
anında turuncuya döndü, Panom'da aynı sinyal doğru sütuna (İzle) düştü.

## 20. Arbitraj tabanı guard'ı — AI Yorumcusu'nun bulduğu tekrarlayan kalibrasyon boşluğu (2026-08-19)

Kullanıcı isteğiyle geçici bir script (`apps/worker/scripts/bulk-debate-tmp.ts`, commit
EDİLMEDİ, iş bitince silindi) yazılıp en yüksek fit'li 46 "Kovala" (arbitrage, fit≥80,
henüz tartışılmamış) sinyal AI Yorumcusu'ndan (çok-ajanlı tartışma odası) geçirildi.
**Sonuç (tüm zamanlar, 58 tartışma): 43 ele (%74) · 15 izle (%26) · 0 kovala (%0).** Tartışılan
HER sinyal ham AI kompozit skorunda zaten "Kovala" idi — tartışma hiçbirini onaylamadı.

**Kök neden (2 gerçek transkript incelenerek doğrulandı, spekülasyon değil):** tek-geçişli
arbitraj analisti kendi sorduğu soruları (`ARBITRAGE_SEED_LENS.questions`: "başka pazarda
gerçekten işe yaramış mı — traction?", "Yerel wedge: Türkiye'de somut giriş noktası?") soruyor
ama cevabı fit puanına yansıtmıyordu. Örnek: "Skippr AI" sinyalinin kendi zenginleştirme verisi
`traction: yok` diyordu, yine de fit=88 almıştı — tartışmada hem Şüpheci Yatırımcı hem
TARAFSIZ Pazar-Rekabet Analisti bunu bağımsız olarak yakaladı (roster yanlılığı değil, gerçek
boşluk). "Cleanlist AI" sinyalinde pazarlar yalnız "UK, EU" idi, Türkiye'ye dair hiçbir iz yok
— yine 88 almıştı.

**Uygulanan düzeltme:** `packages/core/guards.ts`'e yeni bir mekanik guard (g) eklendi —
`GuardContext`'e `lensId`/`traction`/`markets` eklendi, yalnız `lensId==="arbitrage"` VE
`fit>=80` iken devreye girer: traction hem TR/MENA wedge'i (markets içinde "Türkiye"/"Turkey"/
"TR"/"MENA" geçmiyor) ikisi de yoksa ihlal döner, analiz yeniden denenir (guard-retry mekanizması
zaten vardı). `analyst.ts` bu context'i `checkAnalysisGuards`'a artık besliyor. Diğer mercekler
(white_space, custom) etkilenmedi — guard yalnız `lensId==="arbitrage"` iken çalışıyor. 7 yeni
test (`guards.test.ts`), tsc + 226 test (core 73 + worker 36 + web 117) yeşil.

**Sıradaki:** bu guard'ın etkisini görmek için önce mevcut `analyses` satırlarının yeniden
işlenmesi (backfill) gerekmiyor — yalnız sonraki analiz/tick'lerde devreye girer. Bir sonraki
cron koşusundan sonra yeni "Kovala" sinyallerinin bu iki kriteri gerçekten karşılayıp
karşılamadığı gözlenmeli; eğer tek-geçişli skor artık daha güvenilirse, AI Yorumcusu'nun
otomatikleştirilip otomatikleştirilmeyeceği (§21) buna göre yeniden değerlendirilebilir.

## 21. Faz 6 — Yorumcu kapısı: "Kovala"ya güven (2026-08-26)

Ekip kovala çıkan fikirleri gerçekten geliştirip pazara sunmaya başlayacaktı. Bu yüzden önce
sistemin bu role hazır olup olmadığı **canlı veriyle** ölçüldü (read-only Supabase sorguları,
2026-08-25). Ayrıntılı rapor: `FAZ6_PLAN.md`.

**Ölçüm: hazır değildi.** AI'ın "kovala" dediği 79 sinyalin insan kararı: 17 kovala (**%22**),
26 izle, **36 ele (%46)**. Tam uyum %25. AI'ın "ele"si güvenilir (11/11), "kovala"sı değil.
Eşiği yükseltmek kurtarmıyor — kesinlik `fit>=70/75/80/85/88/90` için %13/17/22/22/20/11,
`confidence=high` şartı hiçbir şeyi değiştirmiyor. Sebep: model 0-100 skalasını kullanmıyor,
~10 ayrık değere yığıyor (15×372, 25×197, **88×46**); insanın kovala dediği 18 sinyalin 11'i
tam 88. fit üst uçta sıralama bilgisi taşımıyor.

**Ama AI Yorumcusu çalışıyor:** insanla uyumu **%60** (ham AI %25), yorumcu-kovala →
insan-kovala 4/4. Ve `fit>=80 AND yorumcu "ele" demedi` → kesinlik **%22 → %53** (n=15).
Yorumcu kararın ARKASINDA duruyordu: admin-only, tick başına 3, ve yalnız insan kovala
dedikten SONRA tetikleniyordu. Ayrıca mükerrer kayıtlar bedava bir test-retest verdi:
27 sinyal birden çok tartışılmış, **9'unda farklı sonuç → tutarlılık %67**, yani tek koşu
şansa açık.

**Uygulanan çözüm:**

1. **Yorumcu kapısı** (`apps/web/lib/card-view.ts::resolveGatedBand`) — kompozit bandı
   `pursue` olan her sinyal, insan görmeden **iki bağımsız tartışmadan** geçer. Veto modeli:
   biri "ele" → düşer, en az biri "kovala" → onaylı, ikisi de "izle" → kovala kalır ama
   görünür çekince. ("İkisi de onaylasın" şartı denenmedi: verdict dağılımı 195 ele/62 izle/
   3 kovala — kovala sütununu boşaltırdı.) Tartışma bandı artık **asla yükseltemez**; eski
   `debateVerdict ?? aiBand` izle bandındaki bir sinyali tek bir manuel tartışmayla Kovala
   yapıyordu, bu bir kapı değildi. `pending → watch`: iki tur tamamlanana kadar sinyal
   hiçbir tick'te kovala bandına giremez, yani bütçe yetmezse hata temkinli tarafa bozulur.
2. **Seçim tersine çevrildi** (`debate-auto-select.ts::selectGateCandidates`,
   `debate-auto.ts`): girdi artık `decisions` değil `analyses` üstünden `composite()`.
   `DEBATE_AUTO_LIMIT` 3 → 8 (artık TUR tavanı). İnsan-kovala tetikleyicisi ikincil olarak
   korundu (fit<80 sinyaller için). Tick sırası değişmedi.
3. **Yorumcu herkese açıldı** (`load-debates.ts`) — açıklanmayan bir veto, vetosuzluktan kötü.
   Transkript liste sorgusundan çıkarıldı, `/api/debates/[signalId]` ile lazy yükleniyor
   (260 × 7-tur JSONB her `/queue` render'ında en büyük yüktü). Tetiklemek admin-only kaldı.
4. **Bant hiyerarşisi tek yere indi** (`build-card-view.ts::resolveCardBands`);
   `queue/page.tsx`'in elle yazılmış kopyası silindi, `PanomCard`'ın ham AI çipi "Karar:"
   ile başlayacak şekilde düzeltildi. Panom'un kasıtlı farkı `resolvePanomBand` olarak
   isimlendirilip test edildi.
5. **Canlı bug: ağırlık-kör kompozit confidence** (`ranker.ts`) — `fit` ağırlığa saygı
   duyuyordu ama `confidence` reduce'u tüm analizleri geziyordu. `arbitraj 88/high` +
   `beyaz-alan 25/low` → `confidence: "low"`. Ölçüldü: 662 iki-mercekli sinyalin **354'ü
   (%53)** etkileniyordu; arbitrajı 80+&high olan 36 sinyalin **22'si** bench rozetini
   (`bench.ts`) bu yüzden kaybediyor ve kartta "KOVALA · güven: düşük" yazıyordu.
6. **Grounding mercek özelliği oldu** (`0015`, `lenses.grounding`) — beyaz-alanda AÇIK,
   arbitrajda KAPALI (2026-08-19 pilotu arbitrajda zarar göstermişti). `grounding.ts`
   yeniden yazıldı: sorgu artık marka adından değil **kategori ifadesinden** kuruluyor
   (`enrichment.project_summary` + sektör) — "Skippr AI" üstünde Türkçe arama kaynak makaleyi
   döndürüyordu, muhtemelen %66 low-confidence'ın asıl sebebi buydu. Üç paralel hedefli sorgu
   (TR / TR-MENA İngilizce / fonlama momentumu), gerçek kaynak URL'leri
   `groundingMetadata.groundingChunks`'tan okunuyor, ve sessiz `null` üç ayrı duruma bölündü:
   bulundu / **arandı-bulunamadı** / arama-yapılamadı. Ortadaki durum merceğin 1. sorusunun
   ("'kimse yapmıyor' tek başına olumlu kanıt DEĞİLDİR") var olma sebebi.
7. **Beyaz-alan görünür sinyal** — ağırlık 0 KALICI oldu (r=0.01 ortogonal ama ölçekler
   farklı: ws ort. 34.7 vs arbitraj 78.8; ağırlık 1 verilse 662 analizin yalnız 3'ü 80'i
   geçer). Bunun yerine kartta "Rekabet: boş/kalabalık/karışık/belirsiz" çipi + bant
   değiştirmeyen sıralama tiebreak'i (`competitionRank`). `confidence:low` her fit testinden
   ÖNCE "belirsiz"e düşüyor — satırların %60-66'sı orada.
8. **Sessiz-hata düzeltmeleri**: ingest all-sources-failed guard (tüm 16 kaynak patlasa bile
   `exit 0` ediyordu, diğer beş aşamanın hepsinde bu guard vardı); tüm LLM çağrılarında
   timeout + operasyon deadline'ı (`deadline.ts` — timeout'suz çağrı asılan bağlantıda
   `cron.ts`'in `running` guard'ını kalıcı kilitliyordu); `0014`'te mükerrer tartışmayı
   engelleyen kısmi unique index (**düz `unique(signal_id)` DEĞİL** — çift tur bilinçli);
   demo-fallback üçe bölündü (env yok / DB hatası / sıfır satır) — DB hatasında ekibe
   uydurma fırsatlar gösteriliyor ve üstüne gerçek karar verilebiliyordu. `error.tsx` +
   `global-error.tsx` eklendi (uygulamada hiç yoktu).
9. **Ekip icra akışı**: görevler ekipçe görünür oldu (`load-tasks.ts`; tohumlama kontrolü aynı
   commit'te sinyal bazına indi, yoksa ikinci kişi aynı 3 görevi tekrar tohumlardı), düzenleme
   + silme uç noktaları geldi (`task-templates.ts` bunu zaten vaat ediyordu ama endpoint
   yoktu), `final_decisions.reason` uçtan uca bağlandı (kolon/API/CardView vardı, UI yoktu),
   ve AI'ın `validation_needed` maddeleri "+ göreve ekle" ile checklist'e dönüştürülebiliyor —
   başlangıç görevleri artık jenerik 3 cümle yerine analizin kendi eksikleri.
10. **Ölçüm kalıcılaştı**: `packages/core/eval/calibration.ts` (`pnpm --filter
    @idea-factory/core calibration`) + `/admin` metrikler sekmesinde 8 kalibrasyon kutusu.
    Tabanlar kodda yazılı: kovala kesinliği %22, yorumcu-insan uyumu %60, test-retest %67,
    verdict karışımı 3/62/195, beyaz-alan low %66.

**Kapsam dışı (kullanıcı kararı):** outcome-tracking tablosu kurulmadı — kaynak şirketler
zaten fonlama/satışla doğrulanmış, ekip kendi denemelerini dışarıda takip ediyor. Birikmiş
analiz kuyruğu (%59 kapsama) kapatılmadı — kapı kurulmadan daha çok analiz, daha çok yanlış
kovala demek.

**Doğrulama:** `tsc --noEmit` (core+web+worker) temiz, `next build` (prod) temiz,
`pnpm -r test` **307/307** yeşil (226'dan; 81 yeni test — kapı matrisi, deadline, grounding
sorguları, rekabet tiebreak'i, `load-items` üç dalı, görev silme/düzenleme yetkileri,
kalibrasyon metrikleri, `pg-compat`, ingest toplu-başarısızlık guard'ı, bozuk
`validation_needed` JSONB'si). Kapı seçimi ve migration toleransı gerçek Supabase'e
karşı doğrulandı.

**KULLANICI YAPACAK:** `supabase/migrations/0014_debate_gate.sql` ve `0015_lens_grounding.sql`
Supabase Dashboard → SQL Editor'dan uygulanmalı (REST üzerinden DDL yolu yok). Kod
migration'sız da çalışacak şekilde yazıldı (`lib/pg-compat.ts` — yeni kolon yoksa eski kolon
setine düşer), ama **kapı ancak `0014` uygulandıktan sonra devreye girer**; `debate-auto`
migration olmadan açık bir hata mesajıyla durur (LLM çağrısı yapmadan). Grounding ayrıca
`.env`'de `GROUNDING_ENABLED=true` ister.
