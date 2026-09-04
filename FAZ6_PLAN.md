# Faz 6 — Kovala'ya güven

Tarih: 2026-08-25 · Kapsam: `idea_factory` · Öncelik: **analiz güveni**

---

## 1. Neden

Ekip artık "Kovala" çıkan sinyalleri gerçekten geliştirip pazara sunacak. Kovala rozeti bundan
sonra bir görüş değil, **haftalarca sürecek gerçek işin tetikleyicisi**. Bu turdan önce sistemin
bu role hazır olup olmadığı canlı veriyle ölçüldü (read-only Supabase sorguları).

**Sonuç: hazır değil.**

| | |
|---|---|
| sinyal | 2292 |
| analiz | 2004 (arbitraj 1342 · beyaz-alan 662) |
| insan kararı | 167 (155 eşsiz sinyal-kişi) |
| tartışma | 260 satır / 232 eşsiz sinyal (28 mükerrer) |
| kilitli ekip kararı | **0** |
| görev | 18 (hepsi otomatik şablon) |
| analiz kapsaması | %59 (628 sinyal hiç triage görmemiş) |

### 1.1 Kovala rozetinin kesinliği %22

AI'ın "kovala" dediği 79 sinyalin insan kararı:

| AI dedi | → insan kovala | izle | **ele** |
|---|---|---|---|
| kovala (79) | 17 (**%22**) | 26 (%33) | **36 (%46)** |
| izle (65) | 1 (%2) | 11 (%17) | 53 (%82) |
| ele (11) | 0 | 0 | 11 (%100) |

Tam uyum %25. AI'ın **"ele"si güvenilir** (11/11), **"kovala"sı değil**.

### 1.2 Eşik yükseltmek kurtarmıyor

```
fit>=70  %13      fit>=85  %22
fit>=75  %17      fit>=88  %20
fit>=80  %22      fit>=90  %11
+ confidence=high şartı: hiçbir değişiklik (%22)
```

Sebep histogramda: model 0-100 skalasını kullanmıyor, ~10 ayrık değere yığıyor
(15×372, 25×197, 55×116, **88×46**). fit üst uçta sıralama bilgisi taşımıyor. İnsanın kovala
dediği 18 sinyalin 11'i tam 88.

### 1.3 Ama AI Yorumcusu çalışıyor

| | insanla uyum |
|---|---|
| ham AI bandı | **%25** |
| AI Yorumcusu | **%60** |

Yorumcu-kovala → insan-kovala **4/4**. Ve ölçülen asıl kural:

```
fit>=80                            → kesinlik %22  (n=79)
fit>=80 AND yorumcu "ele" DEMEDİ   → kesinlik %53  (n=15)
```

**2.4 kat.** Yorumcu şu an kararın *arkasında* duruyor: admin-only, tick başına 3 ile sınırlı,
ve yalnız bir insan kovala dedikten **sonra** tetikleniyor. En iyi ayırt edici, ayırt etmesi
gereken andan sonra çalışıyor.

### 1.4 Yorumcunun kendi tutarlılığı %67

Mükerrer kayıtlar bedava test-retest verdi: 27 sinyal birden çok tartışılmış — 18'inde aynı,
**9'unda farklı** sonuç. Tek koşu şansa açık → **çift tartışma**.

### 1.5 Beyaz-alan bağımsız ama kör

Arbitrajla korelasyon **r=0.01** — tamamen ortogonal, gerçek ikinci görüş. Arbitraj 80+ alt
kümesinde ayırıyor: **ws≥60 → %40** (n=10) vs **ws<60 → %7** (n=28).

Ama analizlerinin **%66'sı `confidence: low`** (434/662). Modele web araması olmadan
"TR/MENA'da bu problemi çözen kaç oyuncu var" soruluyor — bilemez.

### 1.6 Canlı bug: ağırlık-kör kompozit confidence

`packages/core/ranker.ts:50` — `fit` ağırlığa saygı duyuyor (`:40,44`), ama `confidence`
reduce'u **tüm** analizler üzerinde koşuyor, ağırlığı yok sayıyor.

Sonuç, bugün canlıda: `arbitraj 88/high` + `beyaz-alan 25/low` → `{fit:88, confidence:"low"}`.

Ölçülen etki: **662 iki-mercekli sinyalin 354'ünde (%53)** ağırlığı 0 olan mercek kompozit
confidence'ı düşürüyor. Arbitrajı `80+ & high` olan 36 sinyalin **22'si** bu yüzden:
- kartta **"KOVALA · güven: düşük"** yazıyor,
- `isBench()` (`bench.ts:12`) `confidence==="high"` istediği için **bench rozetini kaybediyor**,
- `rank()` confidence'ı tazelikten önce tiebreak yaptığı için kendi bandı içinde dibe iniyor.

`ranker.test.ts:152` bu davranışı bilerek doğruluyor — ama o karar beyaz-alanın ağırlığı 0
olmadan ve %66'sının low-confidence olduğu bilinmeden verilmişti.

---

## 2. Kararlar (kullanıcı, bu oturum)

1. **Yorumcu kritik hatta** — tüm AI-kovala adayları, **çift tartışma, ikisi de "ele" demezse
   Kovala**. Bütçe onaylı.
2. **Beyaz-alan kalıyor**, ağırlık 0 kalıyor, grounding **mercek bazında**: beyaz-alan AÇIK /
   arbitraj KAPALI. Web taraması **kapsamlı** olmalı.
3. **Ekip icra akışı**: görevler ekipçe görünür + silinebilir/düzenlenebilir; kilitleme
   gerekçesi UI'a bağlanacak.
4. **Dört sessiz-hata düzeltmesi**: ingest all-failed guard, LLM timeout, mükerrer tartışma,
   demo-fallback.
5. **Outcome-tracking tablosu YOK** — kaynak şirketler zaten fonlama/satışla doğrulanmış, ekip
   kendi denemelerini dışarıda takip ediyor.
6. **Birikmiş analiz kuyruğu kapatılmıyor** — önce kapı. Daha çok sinyal analiz etmek şu an
   daha çok yanlış kovala demek.

---

## 3. Uygulama

### Faz 1 — Worker sağlamlığı (önce bu; diğer her şeyin önkoşulu)

UI değişikliği yok. `0014` migration'ı Faz 2'nin hacim artışından **önce** inmeli.

**1.1 Timeout + operasyon bütçesi**
`providers/gemini.ts:57`, `providers/anthropic.ts:20`, yeni `packages/core/deadline.ts`,
`analyst.ts:65`, `debate.ts:155-190`.

Timeout tek başına yetmiyor: `analyst.ts` `maxRetries:3` ve `debate.ts` 7 tur × 2 deneme ile
90sn/çağrı bile sinyal başına ~6 dk, tartışma başına ~21 dk eder. Tartışma artık kritik hatta
olduğu için **çağrı başına timeout + operasyon başına deadline** birlikte gerekiyor.

- Gemini: `config.abortSignal = AbortSignal.timeout(llmTimeoutMs())` — `grounding.ts:44`'te
  bu SDK sürümünde çalıştığı kanıtlı.
- Anthropic: `messages.create({...}, { timeout })`.
- İkisinde de `AbortError`/`TimeoutError` yakalanıp ayırt edilebilir Türkçe mesajla yeniden
  fırlatılır — yoksa log'da çıplak `AbortError` görünür, asılma ile kota hatası ayrılamaz.
- `analyst.ts` ve `debate.ts`: döngüden önce `deadline = Date.now() + N`, her turda kontrol.
  Deadline aşımında **kısmi `debates` satırı yazılmaz**.
- Env: `LLM_TIMEOUT_MS=90000`, `ANALYZE_DEADLINE_MS=240000`, `DEBATE_DEADLINE_MS=300000`.

**1.2 Migration `0014_debate_gate.sql`**

```sql
-- ön kontrol, 0 dönmeli:
--   select count(*) from debates where jsonb_typeof(transcript) <> 'array';
alter table debates add column kind text not null default 'manual'
  check (kind in ('auto','manual'));
alter table debates add column run_no smallint;
alter table debates add column turn_count int
  generated always as (jsonb_array_length(transcript)) stored;

update debates set kind = 'auto' where created_by like 'otomatik%';
-- mevcut auto satırlara sıra numarası ver (en eski = 1)
with n as (select id, row_number() over (partition by signal_id order by created_at) rn
             from debates where kind='auto')
update debates d set run_no = n.rn from n where n.id = d.id;

create unique index debates_auto_run on debates (signal_id, run_no) where kind = 'auto';
```

> **Kritik:** `signal_id` üstüne düz `unique` constraint **YANLIŞ** olur — sinyal başına iki
> tartışma artık bilinçli. Kısıt aynı turun mükerrerini engeller, çift turu engellemez.
> Ayrıca admin'in elle yeniden tartıştırması (`kind='manual'`) serbest kalır.
>
> `turn_count`: `DebateRoom.tsx:82` `transcript.length` ile "N tur" yazıyor; transkript lazy
> yüklenince bu sayı satırdan gelmeli. Generated column bedava.

`debate-auto.ts` insert'e `kind:'auto', run_no` ekler; PostgREST `23505` **iyi huylu skip**
sayılır (log + `continue`), all-failed guard'ını tetiklemez — yoksa eşzamanlı tick sahte alarm verir.

**1.3 ingest all-failed guard** — `apps/worker/src/ingest.ts:74-98,132`

`fetchAll` bugün kaynak hatalarını yutuyor (`:87-94`) ve hepsi patlarsa `collected=[]` ile
"yeni sinyal yok" yazıp **exit 0** — tick yeşil görünür. Diğer beş aşamanın hepsinde bu guard
var (`enrich.ts:106`, `triage.ts:98`, `analyze.ts:113`, `debate-auto.ts:73`).

`fetchAll` dönüşü `{signals, okSources, failedSources}` olur. `okSources`, satır sayısına
bakılmaksızın tamamlanan `fetch()` ile artar (boş ama sağlıklı feed başarısızlık değil).

```ts
if (sources.length > 0 && okSources === 0) throw new Error(`toplu başarısızlık: 0/${sources.length} kaynak çekilebildi`);
if (failedSources.length > sources.length / 2) console.warn(`[ingest] uyarı: ${failedSources.length}/${sources.length} kaynak patladı — ${failedSources.join(", ")}`);
```

Kısmi hata uyarı kalır, throw değil — tek titrek RSS cron'u kırmızıya çevirmemeli.

---

### Faz 2 — Yorumcu kapısı + bant hiyerarşisi (A ve D birlikte)

**D opsiyonel değil, A'nın önkoşulu.** `queue/page.tsx:36-40` sunucu sıralama bandını kendi
kopya hiyerarşisiyle hesaplıyor; kapıyı öğrenmezse bekleyen/veto edilmiş sinyaller pursue
bandında sıralanıp İzle/Ele olarak render edilir.

**2.1 İki aşamalı bant çözümü** — `apps/web/lib/card-view.ts`

```ts
export type GateState = "n/a" | "pending" | "confirmed" | "caveat" | "vetoed";

/** Yorumcu kapısı. Tartışma bandı ASLA YÜKSELTMEZ — yalnız onaylar, çekince koyar, düşürür. */
export function resolveGatedBand(aiBand, debateVerdicts: Band[], gateEnabled): { band; gate }
export function resolveEffectiveBand(gatedBand, mine, finalDecision): Band
//   => finalDecision ?? mine ?? gatedBand
```

| aiBand | tartışma (2 tur) | → bant | gate | UI |
|---|---|---|---|---|
| ≠ pursue | yok / herhangi | ikisinden **temkinli** olan | `n/a` | — |
| pursue | **< 2 tur** | **watch** | `pending` | "Yorumcu bekleniyor" |
| pursue | biri "ele" | **kill** | `vetoed` | "Yorumcu veto etti" |
| pursue | en az biri "kovala", ele yok | pursue | `confirmed` | "Kovala · Yorumcu onayladı" |
| pursue | ikisi de "izle" | pursue | `caveat` | "Kovala · Yorumcu çekinceli" |

**İki tasarım kararı, ikisi de ölçüme dayalı:**

1. **Veto modeli, "ikisi de kovala desin" değil.** Tartışma verdict dağılımı
   **195 ele / 62 izle / 3 kovala**. `debate === "pursue"` şartı kovala sütununu boşaltır.
   Ölçülen kural zaten veto formu: `fit>=80 AND != kill` → %53. Kullanıcının seçtiği
   "ikisi de ele demezse" tam olarak bu. `DEBATE_WATCH_DEMOTES` sabiti (varsayılan `false`)
   verdict karışımı değişirse sıkı okumaya geçirir.
2. **`pending → watch` flicker sorununun tam cevabı.** fit≥80 bir sinyal, tartışma satırı
   oluşana kadar **hiçbir tick'te** pursue bandında olmaz. Tartışma bütçesi aşılırsa fazlası
   `pending` kalır — hata modu **temkinli** tarafa bozulur, asla sahte Kovala'ya değil.
   Bütçeyi az tahmin etmeyi güvenli kılan özellik bu.

Eşik yeni sabit değil: kapı `composite().band === "pursue"` üstünden çalışır, yani
`fitBand()`'in 80'i (`lenses.config.ts:48-52`). Bant kesimi değişirse kapı bedavaya takip eder.

**Bugünkü `debateVerdict ?? aiBand` YÜKSELTEBİLİYOR** — izle bandındaki bir sinyal, admin'in
elle tartıştırdığı `pursue` verdict'iyle tek başına Kovala görünüyor. Bu bir kapı değil.
*Temkinli-kazanır* ile değiştirilir; ayrıca 260 eski tartışma satırının (eski seçim kuralıyla,
her banttan sinyalde koşmuş) `load-debates.ts` açılınca bantları karıştırmasını da engeller.

**2.2 Kopya hiyerarşileri birleştir**
- `build-card-view.ts` — tek `resolveCardBands({comp, mine, final, debateVerdicts, gateEnabled})`
  → `{aiBand, gatedBand, gate, effectiveBand}`.
- `queue/page.tsx:36-40` — elle yazılmış kopya **silinir**, aynı fonksiyon çağrılır.
- `QueueBoard.tsx:181` — istemci optimistic hesabı `i.gatedBand` üstünden.
- `PanomBoard.tsx:82` — **kasıtlı farkı korunur** (Panom = "ne karar verdik", başkasının
  kararını da içerir; Kuyruk = "sistem ne düşünüyor"). Ama isimsiz kopya olmaktan çıkarılıp
  `card-view.ts`'e `resolvePanomBand(mine, final, latestOther)` olarak taşınır ve test edilir —
  ayrım kodda belgeli olsun, biri değişince diğeri sessizce kaymasın.
- `PanomCard.tsx:46` — ham `item.band` çipi bir *döküm satırında* duruyor (AI/Sen/Yorumcu),
  yani tek başına yanlış değil; asıl kusur satırın **çözülmüş kararı hiç söylememesi**.
  Düzeltme: başa `Karar: <effective>` çipi, `AI:` ham kompozit kalır (dürüst döküm),
  `Yorumcu:` çipi kapı durumunu da gösterir (`bekleniyor` / `veto` / `çekince`).
- `harita`/`trend`/`metrics.ts` ham `composite().band`'de **kalır** (PLAN §19 kararı) — ama
  metrik kutularına "bunlar ham AI sayıları" ipucu eklenir, çünkü artık kuyruktan görünür
  şekilde ayrışacaklar.

**2.3 `load-debates.ts` açılır, transkript lazy olur**

Bugün admin değilse boş harita dönüyor (`:6-7`) → kapı admin olmayanlarda hiç çalışmaz.
`debates` tablosunda kişiye özel veri yok, yani admin kapısının gizlilik gerekçesi de yok.
Ama 260 × 7-tur transkript her `/queue` render'ında en büyük JSONB yükü.

- Liste sorgusundan **`transcript` çıkarılır** (admin için de): `id, signal_id, final_verdict,
  final_commentary, created_by, created_at, kind, run_no, turn_count`.
- Yeni `GET /api/debates/[signalId]` (session-gated, `requireAdmin` yok) — `DebateRoom` ilk
  açılışta çeker. Collapsed etiket `turn_count` kullanır.
- `POST /api/admin/debates` **`requireAdmin` kalır** — okumak bedava, tetiklemek 7 LLM çağrısı.
- Gerekçe: açıklanmayan bir veto, güven için vetosuzluktan daha kötü. Herkes *neden*
  düştüğünü görebilmeli.

> **Duyurulacak risk:** açılış, 260 eski tartışma satırını tek deploy'da herkesin görünümüne
> uygular. Temkinli-kazanır etkiyi yalnız düşürmeyle sınırlar ve çoğu satır zaten insan
> kararının kazandığı sinyallerde — yine de `/queue`'da tek seferlik gözle görülür bir
> yeniden dizilme beklenmeli.

**2.4 Tartışma seçimi yeniden yazılır** — `debate-auto-select.ts`, `debate-auto.ts`

```ts
export function selectGateCandidates(rows, debateCountBySignal): string[]
//   composite band === "pursue" && mevcut auto tur sayısı < 2
//   en yeni analiz önce, fit desc tiebreak
```

`debate-auto.ts` kirli kısmı yapar: `analyses`'ı sinyal bazında yükler, `loadActiveCustomLenses()`
ile registry'yi alır, **core'un `composite()`'ini çağırır** — 80 eşiğini ya da ağırlık kurallarını
yeniden yazmaz. Admin-eklenmiş ağırlıklı mercekler bedavaya kapsanır.

**Eski seçici korunur ve birleştirilir.** `selectAutoDebateCandidates` (insan-kovala tetikli)
hâlâ fit<80 ama insanın beğendiği sinyaller için en değerli tetikleyici. Sıra: önce kapı
adayları, sonra insan-kovala adayları. Aynı iki sorgu.

**Bütçe:** `DEBATE_AUTO_LIMIT` 3 → **8** (koşu tavanı, sinyal değil). Steady-state günde
~2.3 aday × 2 tur; birikmiş 8 aday birkaç tick'te kapanır.

Her koşuda kuyruk log'lanır: `[debate-auto] kapı kuyruğu: N sinyal bekliyor (en eski: X gün)`
— kalıcı takılan bir sinyal (LLM sürekli patlıyor → sonsuza dek `pending`, kovala sütununda
görünmez) yeni tablo olmadan görünür olur.

**Tick sırası değişmiyor.** `package.json:17` zaten `analyze && debate-auto && digest` —
tick N'de analiz edilen sinyal tick N'de kapıdan geçer. Kodda açıkça yazılır ki kimse
"düzeltmeye" kalkmasın.

**Birikmiş 8 aday:** veri migration'ı yok. Deploy'da `pending` olur (İzle + "Yorumcu bekleniyor"
çipi), sonraki 1-2 tick'te tartışılır. Hemen istenirse elle `pnpm --filter worker debate-auto`.

**2.5 UI**
- `DetailPanel.tsx:168-200` döküm satırına kapı eklenir (`· Yorumcu: bekleniyor` / `ELE (veto)`).
  `teamWithAi` artık admin olmayanlarda da dolar — amaç bu.
- `QueueBoard`'a "Yorumcu bekleyenler" filtre çipi; kovala sayacı confirmed/caveat diye ikiye
  ayrılır ki bir çöküş bir bakışta görünsün.
- `lib/demo.ts` — demo kartlarda tartışma yok, `gateEnabled: !demo` geçilmezse demo modu bozuk
  görünür.

---

### Faz 3 — Demo-fallback + sessiz loader'lar

`load-items.ts:29-48` bugün **üç farklı durumu** aynı şekilde ele alıyor:

| durum | bugün | olması gereken |
|---|---|---|
| `serverDb() === null` | DEMO_ITEMS + "Supabase env yok" | ✅ doğru, tek meşru kullanım |
| sayım/sayfa hatası | DEMO_ITEMS + "env yok" (yanlış) | `[] + error` → "Veriler yüklenemedi — <msg>" |
| sıfır satır, DB sağlıklı | DEMO_ITEMS + "env yok" (yanlış) | `[]` → "Henüz analiz yok" |

En kötüsü **sıfır-satır dalı**: doğru kurulmuş, taze deploy edilmiş bir DB'de uydurma fırsatlar
gösteriyor, üstelik env eksikliğini suçlayan bir banner ile. Gerçek karar verilecek bir üründe
kabul edilemez.

**Diğer loader'lar artık Faz 2 bağımlılığı, kozmetik değil:** `load-debates.ts:19` hatada boş
harita dönüyor. Kapıdan sonra sessiz bir `loadDebates` hatası **her** fit≥80 sinyali `pending`e
(İzle) çevirir, hiçbir açıklama olmadan. En az: her loader'da `console.error`; `loadDebates`
için `{map, degraded}` dönüp *"Yorumcu verisi yüklenemedi — kovala rozetleri geçici olarak
beklemede"* render edilir.

Ek: `apps/web/app/error.tsx` + `global-error.tsx` (bugün sıfır tane var — herhangi bir throw
İngilizce Next hata ekranı gösteriyor).

---

### Faz 4 — Beyaz-alan için gerçek web taraması

**4.1 Mercek bazında grounding** — migration `0015_lens_grounding.sql`

```sql
alter table lenses add column grounding boolean not null default false;
update lenses set grounding = true  where lens_id = 'white_space';
update lenses set grounding = false where lens_id = 'arbitrage';
```

`grounding.ts:11-15`'teki sabit `GROUNDED_LENS_IDS` seti ve `lensNeedsGrounding()` **silinir**;
`Lens`/`CustomLensDef` `grounding: boolean` alır; `analyst.ts:75` → `lens.grounding &&
groundingEnabled()`. `GROUNDING_ENABLED` global kill-switch olarak kalır. `LensManager.tsx`'e
checkbox, iki admin route'a alan izni.

Env listesi yerine DB kolonu: grounding pilot olmaktan çıkıp kalıcı bir mercek özelliğine
terfi ediyor, 2026-08-15'ten beri bütün mercekler admin merceği, ve pahalı olanı deploy'suz
kapatabilmek isteniyor. 2026-08-19 pilot bulgusu (grounding arbitrajda zarar verdi) artık
kimsenin göremediği bir kararda değil, veride kodlanmış olur.

> Deploy notu: `.env`'de `GROUNDING_ENABLED=true` aynı anda açılmalı, yoksa migration atıl kalır.

**4.2 Mevcut tek çağrı yetersiz — yeniden tasarım**

Bugünkü `grounding.ts:27-51` beyaz-alanın 6 sorusuna karşı:
- Tek çağrı, **yalnız `signal.title`**'dan kurulmuş tek Türkçe serbest prompt. Başlıklar marka
  adı ("Skippr AI") — ABD markası üstünde Türkçe sorgu kaynak makaleyi döndürür, kategorinin
  Türkiye'deki rakiplerini değil. **434/662 low-confidence satırın en büyük sebebi büyük
  olasılıkla bu.**
- 3-5 cümlelik düzyazı 6 ortogonal retrieval sorusunu cevaplayamaz.
- "mümkünse kaynak/isimle destekle" zorlanmıyor, oysa guard (c) (`guards.ts:44-49`)
  `evidence[].source` **şart koşuyor** — model ya kaynak uyduracak ya confidence'ı
  düşürecek. Düşürüyor.

Yeni `groundSignal(signal, lens, enrichment)`:

1. **Marka adı değil kategori ifadesi türet** — `enrichment.project_summary` + `signal.sector`
   + başlık. `analyst.ts:88`'deki enrichment parse'ı grounding çağrısının (`:75`) üstüne alınır.
2. **Üç hedefli sorgu, `Promise.allSettled`, paralel** (duvar saati ~1× timeout):
   - TR rakip taraması, Türkçe: *"«kategori» Türkiye — bu problemi çözen girişim/ürün var mı,
     kim, hangi olgunlukta?"*
   - TR/MENA rakip taraması, İngilizce: *"«category» startups Turkey MENA competitors
     incumbents"* — yalnız Türkçe arama Wamda/MAGNiTT/Sifted kapsamasını kaçırır.
   - Momentum: *"«kategori» Türkiye yatırım turu / «category» Turkey seed funding last 12
     months"* — bugün hiç cevaplanamayan 5. soruyu besler.
3. **Sorgu başına yapılandırılmış, alıntılanabilir çıktı iste** (çıktı yine serbest metin —
   arama tool'u `responseJsonSchema` ile birlikte çalışamıyor, `gemini.ts:28-32`): kompakt
   `oyuncu — bir cümle — url` listesi + açık "bulunamadı" satırı. Guard (c)'nin `source`
   şartını doğrudan karşılar.
4. **Gerçek URL'leri ekle** — `res.candidates[0].groundingMetadata.groundingChunks[].web`
   okunur, modelin yeniden yazmasına güvenilmez. Satır başına en yüksek alıntı-kalitesi kazancı.
5. **Üç ayırt edilebilir sonuç**, sessiz `null` yerine:
   - bulgu var → bugünkü blok
   - arandı, bulunamadı → *"Canlı arama yapıldı (3 sorgu), TR/MENA'da eşleşen oyuncu
     BULUNAMADI. Bu tek başına OLUMLU kanıt DEĞİLDİR — boşluğun nedenini ayrıca gerekçelendir."*
   - arama başarısız → *"Canlı arama yapılamadı. Rekabet ortamı hakkında arama kanıtı YOK —
     buna dayanarak boşluk iddia etme."*

   Ortadaki durum merceğin 1. sorusunun ("'kimse yapmıyor' tek başına olumlu kanıt DEĞİLDİR")
   var olma sebebi; bugün model bunu grounding'in kapalı olmasından ayırt edemiyor.
6. **Timeout:** sorgu başına `GROUNDING_TIMEOUT_MS` 20s → **30s** (paralel, duvar saati ~30s);
   `GROUNDING_QUERIES` (varsayılan 3) maliyeti ayarlar. Asla fırlatmaz — mevcut sözleşme korunur.
7. **Retry döngüsünün dışında kalmaya devam eder** (`analyst.ts:75`). 3 çağrıyla bu **daha da**
   önemli: retry'lar şema/guard ihlali için, bulgular ise değişmez. Koda not düşülür — artık
   1× değil 3× maliyet hatası olur.

**Maliyet:** beyaz-alan grounding'i sinyal başına 1 → 3 flash-with-search çağrısı.
`ANALYZE_LIMIT=10` ile tick başına +20 çağrı.

**4.3 Ölçüt (şimdiden yazılı):** beyaz-alan `confidence=low` oranı — **taban %66**. Belirgin
düşmezse grounding beyaz-alanda da işe yaramıyor demektir ve geri alınır.

---

### Faz 5 — Beyaz-alan görünür sinyal (ağırlık 0 kalıyor)

**5.1 Ağırlık-kör confidence bug'ı düzeltilir** — `ranker.ts:47-50`

Confidence min'i yalnız **ağırlıklı** mercekler üzerinden alınır; `fit`'teki sıfır-toplam
fallback deseni (`:38-42`) aynen kopyalanır (tüm ağırlıklar 0 ise hepsine düş, sinyal skorsuz
kalmasın). Beyaz-alanın kendi confidence'ı kendi çipinde gösterilir (5.2) — ait olduğu yerde.

Etki: 354 sinyalde kompozit confidence düzelir, 22 sinyal bench uygunluğunu geri kazanır.
`ranker.test.ts:152` güncellenir (`:192` doğru kalır — registry'siz çağrı `DEFAULT_WEIGHTS={}`
üstünden `?? 1` ile ilerliyor), yeni bir test eklenir.

> Risk: `/admin?tab=metrikler`'deki bench sayısı **sıçrayacak**. Amaçlanan düzeltme bu, ama
> önceden söylenmeli.

**5.2 Rekabet çipi** — `build-card-view.ts`, `CardView.competition`

```ts
competition: { fit, confidence, label: "boş" | "kalabalık" | "karışık" | "belirsiz", note } | null
```
- `confidence === "low"` → **"belirsiz"**, herhangi bir fit testinden **önce**. Bugün satırların
  %66'sı burada. Düşük güvenli bir okumayı bulguymuş gibi göstermek, %22 kesinliği üreten
  hatanın ta kendisi. Faz 4'ten sonra bu kova küçülmeli — **boyutu Faz 4'ün KPI'ı**.
- `fit>=60` → "boş" · `fit<40` → "kalabalık" · arası "karışık".
- 60 ölçülen kesim (ws≥60 %40 vs ws<60 %7). Core'da `WHITE_SPACE_GAP_MIN = 60` olarak durur ki
  UI ile metrik kutusu birbirinden kaymasın.

**5.3 Yumuşak uyarı.** `gate ∈ {confirmed, caveat}` **ve** `competition === "kalabalık"` ise
`Kovala · rekabet kalabalık` (soluk ton). **Bandı asla değiştirmez** — n=10 sert kapı için çok
küçük. Tooltip'li bir çekince, o kadar.

**5.4 Sıralama tiebreak'i** — `ranker.ts:53-71`, confidence'tan **sonra**, tazelikten **önce**;
yalnız bant+confidence eşitliğinde, yani asla bant değiştiremez. `RankOptions.competitionTiebreak`
(varsayılan `true`) ile kapatılabilir.

> Risk: `rank()` `/queue`, `/panom`, `/harita`, `/trend` ve `digest.ts` tarafından paylaşılıyor.
> Görünür etki (bant, confidence) grubu içiyle sınırlı ama küresel bir sıra değişikliği.
> `ranker.test.ts:39-123`'teki dört sıra-duyarlı test yeniden koşulur, üç yeni test eklenir.

**5.5 Ölçüm — yeni tablo gerekmiyor.** Her şey zaten `analyses` + `debates` + `decisions` +
`final_decisions`'ta. `metrics.ts`'e saf fonksiyonlar:

| metrik | taban |
|---|---|
| `pursuePrecision` — kapılı bandı pursue olup insan kararı verilenlerde insan-kovala oranı | **%22** |
| aynısı `gate` kırılımıyla (confirmed vs caveat) | hedef ~%53 |
| aynısı rekabet kovasıyla (ws≥60 / ws<60 / belirsiz) | %40 / %7 (n=10/28) |
| `debateVerdictMix` — kill/watch/pursue | 195/62/3 |
| `groundingCoverage` — beyaz-alan low oranı | **%66** |

Bunlar `admin/page.tsx:270-273`'teki *"gerçek doğrulama/çıktı takibi henüz yok"* diyen
`UnmeasuredTile`'ın yerine geçer — insan kararları **sahip olduğunuz ground truth**, outcome
tablosunu reddetmenizin sebebi de tam olarak bu.

> Kutu ipucuna yazılacak çekince: bu, *insan incelemesine* karşı kesinlik ve pursue-bandı
> sinyallerinin yalnız 79'u hiç incelenmiş. Seçim yanlılığı gerçek (insanlar zaten ilginç
> görüneni inceliyor). Sonradan fazla okunmasın diye metinde dursun.

---

### Faz 6 — Ekip icra akışı (dosya kümesi ayrık, paralel gidebilir)

**6.1 Görevler ekipçe görünür** — `load-tasks.ts:16`
`.eq("owner", meName)` kalkar, `owner` seçilip her görevin yanında baş harf olarak render edilir
("sen" kendi görevlerinde). 18 satır — yük sorunu yok.

> **Aynı commit'te zorunlu düzeltme:** `api/decisions/route.ts:38-46` ve
> `api/decisions/final/route.ts:64-72` şablon görev tohumlamasını
> `.eq("signal_id",…).eq("owner", decidedBy)` ile kontrol ediyor. Liste ortaklaşınca **Kovala'ya
> basan ikinci kişi aynı 3 jenerik görevi tekrar tohumlar.** Kontrol sinyal bazına inmeli.

**6.2 Düzenle + sil** — `api/tasks/[taskId]/route.ts`
- `PATCH` `{done?, body?}` — en az biri, `body` trim'li ve boş değil yoksa 400.
- **Yetki ayrımı (bilinçli politika):** `done` toggle'ını **herkes** yapabilir — 3 şablon görev
  Kovala'ya ilk basanın üstünde, ekip onları işaretleyebilmeli. `body` düzenleme ve `DELETE`
  yalnız **sahip veya admin**.
- `TaskList.tsx`: satır içi düzenleme (Enter kaydet, Esc iptal), `×` ile optimistic silme +
  hata rollback, sahip etiketi.

**6.3 `final_decisions.reason` uçtan uca**
Kolon, API (`decisions/final/route.ts:23,37`), loader ve `CardView.finalReason` **zaten var ve
çalışıyor**. Eksik olan yalnız iki gönderen ve iki render:
- `DetailPanel.tsx:93-111` — POST'tan önce satır içi "Neden bu karar? (opsiyonel)" alanı.
  **Zorunlu yapılmaz** — buradaki sürtünme özelliği tamamen öldürür.
- `PanomBoard.tsx:152-170` — "Kilitle" çipi iki adımlı olur.
- Render: `DetailPanel:206-210` "Kesinleşti" çipinin altında; `PanomCard:132-139` kısaltılmış
  + `title`.

**6.4 `validation_needed` → göreve dönüştür** *(Faz 6'nın en değerli maddesi)*
`PURSUE_STARTER_TASKS` (`task-templates.ts:7-11`) üç jenerik cümle — "Kurucuya/ekibe ulaş",
"Rakip ve pazar taraması yap", "Fiyatlandırma & TAM notu çıkar" — kovalamayı haklı çıkaran
analizle **sıfır bağlantısı** var. Oysa guard (d) (`guards.ts:56-58`) analisti 3'e kadar somut,
yapılandırılmış `{data, why, how_to_verify}` üretmeye **zorluyor** ve bunlar
`DetailPanel.tsx:304-315`'te salt-okunur duruyor.

- Madde başına **"+ Göreve ekle"** → `body = "${v.data} — ${v.how_to_verify}"` (`why` tooltip'te),
  artı "Tümünü ekle". Mevcut görev metinlerine karşı istemci tarafı dedupe.
- **Tohumlama şablondan değil analizden:** `starterTasksFor(validationNeeded)` — varsa onu
  kullan, yoksa jenerik 3'e düş. İki tohumlama noktasına birer ek sorgu. Ucuz ve kesinlikle
  daha iyi.

---

## 4. Sıra ve commit dizisi

| # | İçerik | Neden burada |
|---|---|---|
| 1 | Faz 1 (timeout+deadline, `0014`, ingest guard) | Asılan LLM sonraki her fazı durdurur; unique index tartışma hacmi artmadan inmeli |
| 2 | **Faz 2 (A + D birlikte)** | Asıl güven düzeltmesi. D temizlik değil, önkoşul |
| 3 | Faz 3 (demo-fallback) | Faz 2'nin dokunduğu loader dosyaları; `loadDebates` sessiz hatası Faz 2 bağımlılığı |
| 4 | Faz 4 (grounding) | Beyaz-alan girdi kalitesi; satırların %66'sı low iken Faz 5 eşikleri gürültü |
| 5 | Faz 5 (rekabet sinyali + confidence bug + metrikler) | Faz 4'ün çıktısına muhtaç; metrikler Faz 2 ve 4'ü geriye dönük ölçer |
| 6 | Faz 6 (ekip akışı) | Ayrık dosya kümesi — baştan paralel gidebilir |

Toplam yeni migration: **iki** — `0014_debate_gate.sql`, `0015_lens_grounding.sql`.
**Yeni tablo yok** (outcome tracking reddi ile tutarlı).

---

## 5. Doğrulama

**Birim:** yeni `debate-gate.test.ts` (kapı matrisinin tamamı), `deadline.test.ts`,
`grounding.test.ts`, `load-items.test.ts` (üç dal), yeniden yazılan `debate-auto-select.test.ts`,
genişletilen `card-view.test.ts` (5 → ~16), `ranker.test.ts` (ağırlıklı confidence + rekabet
tiebreak), `tasks/[taskId]` DELETE/PATCH-body. `tsc --noEmit` + `pnpm -r test` (bugün 226 yeşil).

**Worker kapalı devre:** tek tick lokal koşulur; yeni kovala adayı için iki `debates` satırı
(`kind='auto'`, `run_no` 1 ve 2) yazıldığı REST ile doğrulanır.

**Canlı UI** (`/browse`, gerçek Supabase):
1. 2 tartışması olan sinyalde rozet kapı sonucunu gösteriyor
2. 1 tartışması olanda "Yorumcu bekleniyor" (İzle bandında)
3. admin olmayan hesapta verdict görünür, transkript ancak tıklayınca yükleniyor
4. kilitlerken gerekçe yazılıp kartta okunuyor
5. bir hesabın eklediği görev diğerinde görünüyor, ikinci kişi Kovala'ya basınca görev
   mükerrer tohumlanmıyor

**Kalibrasyon kontrolü (kapı sonrası):** aynı read-only sorgu tekrarlanır —
`kapılı bant = pursue` alt kümesinde insan-kovala oranı. **Taban %22, hedef ≥%50.**
Ölçüm scripti geçici scratchpad'den çıkarılıp `packages/core/eval/` altına alınır
(tek seferlik değil, tekrarlanabilir olsun).

**Grounding kontrolü:** beyaz-alan `confidence=low` oranı. **Taban %66.** Düşmezse Faz 4 geri alınır.

---

## 6. Kapsam dışı (bilinçli)

Outcome-tracking tablosu · birikmiş 950 analiz / 628 triage kuyruğu · kademeli model
(`PLAN.md §11 madde 2`'nin diğer yarısı) · arbitraj rubriğinin yeniden yazımı · fit
kuantizasyonu · koşu-kaydı (run log) tablosu · web'de component/e2e test altyapısı ·
oturum iptali (session revocation) · CSRF · `/admin` `loading.tsx` · kaynak etiketi
eksikleri (`source-labels.ts` 5/16) · `IngestionSettingsForm` 11 yeni kaynağı göstermiyor.


---

## 7. Uygulama kaydı (2026-08-26 — tamamlandı)

Altı fazın hepsi uygulandı. `PLAN.md §21`'de kalıcı kayıt var.

**Doğrulama:** `tsc --noEmit` (core+web+worker) temiz · `next build` (prod) temiz ·
`pnpm -r test` **307/307** yeşil (226'dan). Kapı değişmezleri 120 kombinasyonla ayrıca
uçtan uca doğrulandı (pursue rozeti 2 tur olmadan asla çıkmıyor, tartışma asla
yükseltmiyor, herhangi bir "ele" pursue'yu düşürüyor).

**Plana göre yapılan sapmalar / eklenenler:**
- `debates` unique kısıtı tasarım turunda `unique(signal_id) where kind='auto'` önerilmişti;
  bu ÇİFT TURU engellerdi. `(signal_id, run_no) where kind='auto'` olarak düzeltildi.
- `lib/pg-compat.ts` eklendi (planda yoktu): migration'lar elle uygulandığı için kod ile şema
  arasında kaçınılmaz bir pencere var. O pencerede `load-debates` patlarsa HER kovala
  `pending`e düşer, `load-lens-registry` patlarsa mercek listesi boşalır ve ağırlığı 0 olan
  beyaz-alan kompozit skora karışır. Yeni-kolonlu sorgu 42703 verirse eski kolon setine
  düşülüyor; gerçek DB'ye karşı iki yol da doğrulandı.
- `fetchAllSources` `ingest.ts`'ten ayrı modüle çıkarıldı — `ingest.ts` import edilir edilmez
  `main()` koştuğu için toplu-başarısızlık guard'ı test edilemiyordu.
- Grounding kapısı `analyst.ts`'e de kondu (yalnız `groundSignal` içinde değil): enjekte
  edilen bir grounder da maliyet kuralına uymalı.
- İnceleme bulguları düzeltildi: bozuk `validation_needed` JSONB'si `starterTasksFor`'u
  çökertiyordu; `TaskList` tam-liste rollback'i eşzamanlı iki işlemde ikincisinin iyimser
  durumunu siliyordu (artık satır bazlı geri alma).
- `text-danger` sınıfı Tailwind config'de tanımlı değildi (hata mesajları renksiz kalırdı) —
  repodaki mevcut `text-kill` yakınsamasına çevrildi.

**Devralınan iki kırık test düzeltildi** (bu turun işi değildi, "10 yeni kaynak" commit'inden
kalmıştı): `source-health.test.ts` ve `ingestion-settings/route.test.ts` sabit 5-kaynak
listesine bağlıydı; artık `KNOWN_SOURCES`tan türetiliyor, yeni kaynak eklemek testi kırmıyor.

**KULLANICI YAPACAK — kapı bunlar olmadan devreye GİRMEZ:**
1. `supabase/migrations/0014_debate_gate.sql` → Supabase Dashboard → SQL Editor → Run
   (ön kontrol sorgusu dosyanın başında, 0 dönmeli).
2. `supabase/migrations/0015_lens_grounding.sql` → aynı yer.
3. Grounding için `.env`'de `GROUNDING_ENABLED=true`.
4. İlk tick'ten sonra: `pnpm --filter @idea-factory/core calibration` — kapılı kovala
   kesinliği ve beyaz-alan low-confidence oranı taban değerlerle karşılaştırılır.

Migration uygulanmadan: web tarafı eski kolon setine düşüp çalışmaya devam eder (kapı
kapanmaz, kartlar bugünkü gibi görünür); `debate-auto` ise LLM çağrısı yapmadan açık bir
hata mesajıyla durur ve cron kırmızıya döner — sessizce yanlış çalışmaz.
