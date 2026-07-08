# Idea Factory — İş Modeli v2 (CEO/PM gözüyle)

> **Bu dokümanın yeri:** `PLAN.md` §İş Modeli'ni **günceller ve genişletir.** `IDEA.md` ve
> `PLAN.md`'deki ürün/mimari içeriği geçerli kalır; bu doküman yalnızca *iş modeli* katmanını
> CEO/PM merceğinden yeniden çerçeveler. Çelişki olduğunda bu doküman esas alınır.

---

## 0. Özet (TL;DR)

**Ne:** Tez-odaklı bir **giriş & pazar istihbaratı platformu**. Ulaşılabilir kaynaklardan
startup/pazar sinyallerini sürekli toplar, bunları config-driven bir **tez** ve **çok-mercekli
AI analiz** katmanından geçirir, **sıralı fırsat kuyruğu** + **sorgulanabilir ekosistem hafızası**
üretir.

**Kime:** Önce kendi girişimci networkümüz (dahili araç). Sonra: deal-flow / inovasyon kaynağı
arayan profesyonel para sahipleri ve kurumlar (melek/scout, hızlandırıcı, kurumsal inovasyon —
beachhead Faz 1 öğrenmeleriyle kesinleşir).

**Nasıl para kazanır:** Workspace başına SaaS aboneliği (tez sayısı + koltuk + derin-analiz
kotasına çapalı kademeler) + yüksek hacimde LLM kullanımının passthrough/kotası. Yüksek brüt
marj, çünkü ağır iş ucuz toplu modelle yapılır; pahalı model yalnız kısa listeye uygulanır.

**Neden savunulabilir:** Asıl moat ham veri *değil* — küratörlü **tez + mercek IP'si**,
`skillify`'la kalıcılaşan **kaynak kütüphanesi**, **workflow lock-in**, ve zamanla compound eden
**bilgi tabanı (gbrain)**.

**Konumlanma kararı:** Şirket **global, tez-bağımsız bir platform.** Türkiye/arbitraj = ilk *tez*
ve ilk ispat noktası, marka değil. Mimari (config-driven tez + eklenebilir mercek) bunu zaten
destekliyor.

---

## 1. CEO Review — mevcut modelin dürüst eleştirisi

`PLAN.md` §İş Modeli düşünceli, ama bir yatırımcının/operatörün ilk turda yakalayacağı 8 boşluk
var. v2 her birini bir bölümle karşılar (parantezdeki referans).

1. **"Fikir = özellik, ürün değil" riski (→ §2, §4, §7).** Fikir üretmek ucuzdur; insanlar fikir
   için ödemez. Savunulabilir olan **workflow + doğrulama + biriken hafıza**. Bu varoluşsal soru
   açıkça konfronte edilmeli, yoksa "güzel demo, zayıf iş" tuzağına düşeriz.
2. **Odak yok (→ §3).** Faz 2'de 5 segment listelenmiş (networkler, melekler, hızlandırıcılar,
   kurumsal, VC scout) ama hiçbiri önceliklendirilmemiş. 5 segment = 0 segment.
3. **Kuzey Yıldızı / başarı metriği yok (→ §5).** "Sıralı fırsat" üretiliyor ama "iyi sıralama"yı
   ölçen bir tanım yok. Ölçemediğimiz şeyi satamayız.
4. **Değer önerisi feature-ağırlıklı (→ §4).** Hız/kanaat/bilgi birer özellik; alıcının önemsediği
   *sonuç* (daha az kaçırılan fırsat, daha hızlı kanaat, daha yüksek isabet). Para sonuca akar.
5. **Moat iddiaları abartılı (→ §7).** "Veri ağ etkisi" tek küçük networkün karar verisinden
   yıllarca anlamlı kişiselleşme üretmez. Bu iddiayı sağ-boyutlayıp gerçek moat'ı öne almalıyız.
6. **Rekabet konumlanması yok (→ §8).** Specter/Harmonic/Tracxn/CB Insights/Exploding Topics var.
   "Crunchbase pahalı" demek konumlanma değil; farklılaşma eksenini söylemeliyiz.
7. **"Alfanı rakibe satmak" paradoksu + internal→B2B sıçraması gerekçesiz (→ §3, §9).** Eğer bu
   bizim fırsat-bulma avantajımızsa, neden rakip olabilecek networklere satalım? Ve dahili bir
   aracın neden genelleşeceği kanıtlanmamış.
8. **Ticari doğrulama yok (→ §9).** Faz 2'yi inşa etmeden önce ödeme isteğini test eden bir plan
   (design partner / LOI / fiyat konuşması) yok.

---

## 2. Konumlanma & Çerçeve

- **Kategori:** *Thesis-driven venture & market intelligence.* "Deal sourcing" veya "idea
  generator" değil — bu kategoriler ya doymuş ya da düşük-değer algılanıyor. Bizim açımız:
  **bir teze göre sürekli sentez + kanaat.**
- **Türkiye/arbitraj = ilk tez, marka değil.** İlk keskin ispat noktası (dar, ölçülebilir, bizim
  iyi bildiğimiz pazar). Platform `thesis.config.ts` + eklenebilir mercek sayesinde tez-bağımsız;
  ikinci tez (örn. fintech-EU, B2B-SaaS-US) tek config'le açılır. Bu, "global platform" vizyonunun
  teknik karşılığıdır — yeni kod değil, yeni veri.
- **Neden biz, neden şimdi:** LLM maliyeti + agentik scraping ucuzladı. Daha önce yalnız pahalı
  veri abonelikleriyle (Crunchbase/PitchBook, on binlerce $/yıl) ve insan analistle yapılabilen
  sentez, artık ulaşılabilir kaynaklardan + config-driven tezlerle üretilebiliyor. Pencere şimdi
  açık; bu, fiyat/erişim engelini yıkan klasik bir "AI ile maliyet tabanını çökert" hamlesi.

---

## 3. Müşteri / ICP (önceliklendir, kilitleme)

Beachhead'i tek bir segmente **kilitlemiyoruz**; Faz 1 öğrenmeleriyle kesinleşecek. Ama adayları
net kriterlerle **sıralıyoruz** ki Faz 1 boyunca doğru kapıları çalalım.

| Segment | Ödeme isteği | ROI netliği | "Alfa satma" çakışması | Satış döngüsü | ACV | Öncelik |
|---|---|---|---|---|---|---|
| Melek grupları & mikro-VC / scout | Yüksek | Yüksek (daha iyi deal-flow = net $) | Yok | Kısa-orta | Orta | **1** |
| Hızlandırıcı & kurumsal inovasyon | Orta-yüksek | Orta-yüksek | Yok | Uzun | Yüksek | **2** |
| Diğer kurucu networkleri | Orta | Orta | **Var** (potansiyel rakip) | Kısa | Düşük-orta | **3** |

**Okuma:**
- **Rakip-olmayan segmentler (melek/scout, kurumsal) öncelikli** — "alfa satma paradoksu"nu
  çözerler: onlara satmak bizim kendi giriş avantajımızı aşındırmaz.
- Kurucu networkleri en kolay empati/case-study kaynağı (bize en çok benzeyen kullanıcı) ama hem
  düşük ACV hem rakip riski taşır → sıralamada sonra.
- **Beachhead kesinleştirme tetikleyicisi:** Faz 1'de 3-5 dış görüşmede tekrarlayan, ödemeye
  istekli bir "acı" bulduğumuz ilk segment beachhead olur (bkz. §9).

---

## 4. Değer Önerisi (feature → sonuç)

Özellikleri alıcının önemsediği iş sonucuna bağlıyoruz. "Job to be done": *"Doğru girişim/yatırım
fırsatını, rakiplerimden önce ve daha az emekle, yüksek kanaatle seçmek."*

| Özellik (PLAN.md) | İş sonucu (alıcının önemsediği) | Ölçü |
|---|---|---|
| Hız (literatür yükünü kaldırır) | **Daha az kaçırılan fırsat** + daha hızlı karar | Time-to-conviction ↓ |
| Kanaat (tez'e göre puanlar) | **Daha yüksek isabet**, boşa emek azalır | Hit-rate (pursued→validated) ↑ |
| Bilgi birikimi (sorgulanabilir hafıza) | **Kurumsal hafıza**, tekrar araştırma yok | Sorgu kullanımı / "tekrar bulundu" ↓ |

Mesaj tek cümlede: *"Sinyal içeri → tezine göre sıralı, gerekçeli, sorgulanabilir fırsatlar dışarı —
böylece doğru bahsi daha erken ve daha az emekle koyarsın."*

---

## 5. Kuzey Yıldızı + Metrikler

- **North Star Metric:** **Kovalama kararına dönüşen ve gerçek değer yaratan firsat oranı**
  (pursued → validated/launched **hit-rate**). Bu, "iyi sıralama"yı tek sayıya indirir ve hem
  ürünün hem satışın çapasıdır.
- **Leading göstergeler (Faz 1'de manuel izlenir, Faz 2'de satış kanıtı olur):**
  - Haftalık **nitelikli fırsat** sayısı (eşik üstü skor).
  - **Karar/sinyal oranı** — kuyruk gerçekten aksiyon doğuruyor mu (engagement).
  - **"Kovala" isabeti** — kovalananların ne kadarı doğrulanıyor (kalite).
  - **Bilgi-tabanı sorgu kullanımı** — hafıza katmanı gerçekten kullanılıyor mu (lock-in sinyali).
- **Karşı-metrik (guardrail):** gürültü oranı / yanlış-pozitif — North Star'ı hacimle şişirmeyi
  engeller.

---

## 6. Para Modeli & Fiyatlandırma

- **Kademeler değere çapalı** (koltuk başına değil; değer sürücülerine bağlı):

  | Kademe | Aktif tez | Koltuk | Kaynak | Derin-analiz kotası | Hedef alıcı |
  |---|---|---|---|---|---|
  | **Solo** | 1 | 1 | Çekirdek set | Düşük | Bireysel scout / kurucu |
  | **Team** | 3 | 5 | Genişletilmiş + 1 özel scraper | Orta | Melek grubu / mikro-VC |
  | **Network** | Sınırsız* | 20+ | Özel kaynaklar + öncelikli | Yüksek + passthrough | Hızlandırıcı / kurumsal |

  \* adil-kullanım kotasıyla.

- **Usage katmanı:** Yüksek hacimli derin analiz (Opus) maliyetini fiyata bağlamak için üst
  kademede kota + aşım passthrough. Bu, LLM maliyetinin marjı yemesini engeller.
- **Birim ekonomisi mantığı (yüksek brüt marj):** *faz 2 kademesi* — tüm sinyaller ucuz toplu
  modelle (`claude-sonnet-4-6`) skorlanır; yalnız kısa liste pahalı modele (`claude-opus-4-8`)
  gider. (**v1 = tek model** Opus; hacim düşük, kademeye gerek yok.) Dedup + tez filtresi analiz
  öncesi hacmi düşürür. Hedef: bir hesabın aylık LLM maliyeti, aboneliğin küçük bir yüzdesi.
- **Go-to-paid motion:** Faz 1 başarı hikâyeleri → design-partner indirimi (erken erişim karşılığı
  geri bildirim + referans) → LOI → ücretli pilot.

---

## 7. Moat — dürüst, sağ-boyutlanmış

**Abartılanı küçült:**
- "Veri ağ etkisi"ni *uzun vadeli teori* olarak işaretle. Tek küçük networkün karar verisi
  yıllarca anlamlı kişiselleştirme üretmez; bunu ana moat gibi satmak inandırıcılığı zedeler.

**Gerçek (ve daha erken devreye giren) moat'ı öne al:**
1. **Tez + mercek IP'si** — küratörlü, sektör-dikey tez şablonları ve özel analiz mercekleri.
   Kopyalaması ürün değil *yargı* gerektirir.
2. **Kaynak/scraper kütüphanesi** — `skillify` ile kalıcılaşan, health-check'li scraper'lar.
   Rakibin sıfırdan kurması zaman + bakım yükü.
3. **Workflow lock-in + biriken bilgi tabanı (gbrain)** — kararlar, gerekçeler, ekosistem hafızası
   müşterinin günlük akışına yerleşir; veri taşınabilir değil, *bağlam* taşınabilir değil.
4. **Tez-dikey paketler** — her dikey için hazır tez + kaynak seti; dağıtım ve onboarding hızı.

Bu sıralama dürüst: 1-3 kısa vadede gerçek, "veri ağ etkisi" ise zamanla *eklenen* bir kat.

---

## 8. Rekabet Haritası

| Oyuncu | Ne yapar | Bizden farkı |
|---|---|---|
| CB Insights / PitchBook / Crunchbase | Geniş veri + raporlar | Pahalı, ham veri/genel rapor; tez-odaklı kanaat üretmez |
| Tracxn | Sektör/şirket veritabanı | Veritabanı odaklı; çok-mercekli sentez ve aksiyon kuyruğu yok |
| Specter / Harmonic | Sinyal-bazlı startup keşfi (growth signals) | Sinyal güçlü ama *senin tezine göre* puanlama + sorgulanabilir hafıza yok |
| Exploding Topics / trend araçları | Trend tespiti | Tek mercek (trend); arbitraj/uyarlama ve karar workflow'u yok |

**Farklılaşma ekseni (tek cümle):** Biz ham veri agregatörü değiliz →
**tez-odaklı çok-mercekli sentez + arbitraj/uyarlama merceği + config-driven taşınabilir tezler +
sorgulanabilir kurumsal hafıza.** Yani "veri" değil, **kanaat + bağlam** satıyoruz.

---

## 9. İş Modeli Doğrulama Planı (build'den önce)

Faz 2'yi inşa etmeden, Faz 1 boyunca *ticari* sinyali test ederiz — kod değil, ödeme isteği:

1. **Sorun mülakatları (haftalar 1-4):** §3 sıralamasındaki ilk 2 segmentten 3-5 kişiyle görüş;
   tekrarlayan, ödemeye istekli "acı" var mı? → **beachhead'i bu kesinleştirir.**
2. **Design partner (2-3):** dahili aracı erken erişimle paylaş; geri bildirim + referans karşılığı
   indirim. North Star'ı (hit-rate) onların datasında da gözle.
3. **Fiyat-duyarlılık konuşması:** §6 kademelerini test et (van Westendorp / basit "şuna ne
   ödersin"). LOI hedefle.
4. **Çıkış kriteri (Faz 2'ye geçiş):** ≥2 imzalı LOI/pilot **ve** dahili North Star'ın anlamlı
   olduğunu gösteren veri.

**"3 iş modeli yürütme" tuzağından kaçın:** Knowledge-layer'ı *ayrı araştırma ürünü* olarak satmak
cazip bir **hipotez** ama Faz 2'ye kadar buna bağlanma. Çekirdek (sıralı fırsat + tez istihbaratı)
kanıtlanmadan ikinci/üçüncü iş modeli odak dağıtır.

> **Kanıt asimetrisi (v1'de dürüstçe kabul).** v1 ücretsiz kaynakları (YC/PH/fonlama feed'leri)
> *arz*ı kanıtlar — "bu iş başka pazarda çalışıyor". Ama *yerel talep/acı*yı kanıtlamaz; onun tek
> ücretsiz yolu `web_search` + yerel bilgi ve asıl olarak **bu bölümdeki sorun mülakatlarıdır**.
> Yani yerel-talep kanıtını feed değil, doğrulama planı üretir; analistin yerel ayak için
> `confidence: low, doğrulanmalı` demesi normaldir (bkz. `THESIS_AND_LENS.md §1` kanıt asimetrisi).
>
> **Köprü — Validation Block → sorun mülakatları:** analistin `validation_needed` çıktıları
> ("X pazarı CAC maliyeti", "Y segmentinin ödeme isteği"…) bu bölümdeki sorun mülakatlarının
> (§9.1) soru listesine **ham madde** olur. Analiz katmanı doğrulama planını besler: sistem
> yalnız "kanıt zayıf" demez, mülakatta neyin sorulacağını üretir.

---

## 10. Riskler & Açık Stratejik Kararlar

- **Fikir-ürün riski (en kritik):** "fikir üreten araç"a kimse ödemez. Azaltma: değeri
  *workflow + doğrulama + hafıza + hit-rate*'e çapala (§4-§5); demo değil, sonuç sat.
- **Kaynak kırılganlığı (ticari):** scraper bozulursa veri kalitesi düşer → müşteri kaybı.
  Azaltma: RSS/API öncelik, `skillify` + health-check, kaynak-başı izleme.
- **Alfa satma çakışması:** rakip-olmayan segmentlere öncelik (§3); kurucu networklerine satışı
  coğrafi/sektörel çakışmayanlarla sınırla.
- **Satış döngüsü uyumsuzluğu:** kurumsal yüksek ACV ama yavaş; nakit akışı için kısa-döngü
  (melek/scout) ile başla.
- **Açık karar — beachhead kesinleştirme:** §9 sorun mülakatları sonrası ilk net "acı + ödeme"
  segmenti seçilir.
- **Açık karar — ikinci tezin zamanlaması:** Türkiye tezi North Star'ı kanıtladıktan sonra mı,
  yoksa platform-bağımsızlığı erken kanıtlamak için paralel mi? (Öneri: önce derinlik, sonra
  genişlik.)

---

### Sonraki adım
Bu doküman onaylanırsa, dahili Faz 1 ile paralel **§9 doğrulama planını** başlat. Dokümanı bir tur
daha sertleştirmek için gstack **`/plan-ceo-review`** çalıştırılabilir.
