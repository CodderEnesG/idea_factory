# Idea Factory — Somut İlk Tez + Arbitraj Merceği

> **Bu dokümanın yeri:** `AI_ANALYST.md` (persona) ve `MARKET_KNOWLEDGE.md` (grounding) felsefesini
> **somuta** indirir: ilk tez konfigürasyonunun gerçek değerleri + arbitraj merceğinin tam soru
> çerçevesi. Aşağıdaki değerler **v1 için kesinleşmiştir** (network ile alan-alan dolduruldu);
> yeni yanlış pozitifler çıktıkça yalnız `anti_patterns` genişler.

---

## 1. İlk tez: Türkiye arbitraj mandası (v1 — kesinleşti)

Tez = analistin "neyi iyi sayacağının" sabit zemini (mandate).

| Alan | v1 değeri | Neden önemli (analist bunu nasıl kullanır) |
|---|---|---|
| `capital_range` | **Minimal / sermaye-hafif** (bootstrap-önce, ~$0–100K) | Kovalanabilir fırsatı sermaye gerçeğine göre eler; büyük ön yatırım gerektiren fikri baştan düşürür (sermaye-ağır = anti-pattern) |
| `target_markets` | **Türkiye (birincil, ispat pazarı); genişleme global** | Arbitraj hedefi; uyarlama analizinin yapılacağı ilk pazar Türkiye, ölçek sonra global |
| `sectors` | **B2B SaaS, fintech, e-ticaret altyapısı, vertical SaaS** | Odak; dışı düşük öncelik (ama "tez-dışı ama ilginç" kovası açık kalır) |
| `capabilities` | **Yazılım/ürün, hızlı GTM, yerel pazar erişimi** | "Bizim yapabileceğimiz" işi öne çıkarır; yetkinlik dışını işaretler |
| `risk_appetite` | **Orta** — kanıtlı model + yerel uyarlama; derin Ar-Ge düşük | Erken/riskli vs kanıtlı fırsat dengesini ayarlar |
| `anti_patterns` | **Ağır regülasyon (lisanslı bankacılık/sağlık); ödeme isteği (WTP) belirsiz; sermaye-ağır (büyük ön yatırım gerektiren)** | Bilinen yanlış pozitifleri **baştan bastırır** — en güçlü kalibrasyon |

> **Not (anti_patterns kapsamı):** "tek-şehir hikâyesi" ve "network-effect'siz pazaryeri" v1
> başlangıç setinden **çıkarıldı** — analist bunları otomatik bastırmaz. Gerçek yanlış pozitif
> olarak karşımıza çıkarlarsa sonradan eklenir. `anti_patterns` listesi zamanla en değerli varlık
> olur — her yanlış pozitif buraya eklenir, analist bir daha aynı tuzağa düşmez.

> **Not (kanıt asimetrisi — v1'de dürüstçe kabul edilir):** Arbitraj kanıtının iki ayağı var:
> (a) *orada işe yarıyor mu* — ücretsiz feed'ler (YC/PH/fonlama) bunu güçlü verir; (b) *burada acı
> var mı* (yerel wedge/talep) — ücretsiz feed'de yok, `web_search` + yerel bilgi + zamanla network
> ile dolar. Yani v1'de yerel-talep kanıtı **yapısal olarak zayıf/spekülatif** olacak. Bu yüzden
> analistin ilgili ayak için `confidence: low, doğrulanmalı` demesi **doğru davranıştır, hata değil.**

---

## 2. Arbitraj merceği — analistin soru çerçevesi

Mercek = aynı sinyale sorulan belirli soru dizisi. Arbitraj merceği her sinyal için sırayla şunları
sorar (çıktı yapılandırılır, her sayının yanında gerekçe + güven):

1. **Kanıt** — Bu, başka bir pazarda (ABD/AB/vb.) gerçekten işe yaramış mı? Traksiyon/fonlama/
   büyüme kanıtı ne? (Yoksa arbitraj değil, spekülasyon.)
2. **Yerel wedge** — Türkiye/MENA'da somut giriş noktası ne? Hangi dar segment, hangi acı?
3. **Uyarlamada ne kırılır?** — En kritik soru. Yeni pazarda neyin *değişeceğini* düşün:
   - **Regülasyon** — lisans/veri/sektörel kısıt var mı?
   - **Ödeme altyapısı** — yerel ödeme/banka gerçeği modeli bozar mı?
   - **Kültür & davranış** — tüketici alışkanlığı farklı mı?
   - **Dağıtım kanalı** — burada hangi kanal işler, CAC ne?
   - **Ödeme isteği** — fiyat hassasiyeti modeli öldürür mü?
   - **Yerel ikame** — zaten bir yerel oyuncu/alışkanlık bu işi görüyor mu?
4. **Zamanlama** — Neden *şimdi*? Yeni bir yetenek/maliyet eğrisi/regülasyon bunu mümkün mü kıldı?
5. **Kim deniyor?** — Türkiye/MENA'da zaten bu fikri kovalayan var mı? (gbrain + web ile.)
6. **Önerilen aksiyon** — kovala / izle / ele — ve **neden**, bu teze göre.

   **İzle kuralı (operasyonel):** izle = teze uyum sinyali var, AMA `validation_needed`'daki
   1-2 kritik veri karar değiştirebilir; kanıt gelince kovala ya da ele'ye düşmek zorundadır.
   İzle bir bekleme odasıdır, kararsızlık çöp kutusu değil: **her "izle" çıktısı
   `validation_needed`'da neyi beklediğini yazmak zorundadır — yazamıyorsa izle değil, ele'dir.**
   Bu kural örneklerle kalibre edilir ve `anti_patterns` gibi evrilir: etiketlemede insan-arası
   tutarsızlık çıktıkça kurala cümle eklenir.

### Çıktı şeması (kavramsal — `AI_ANALYST.md §5` ile uyumlu)
```
{
  lens: "arbitrage",
  fit: 0-100,                 // teze uyum — katı bant kuralı (aşağıda)
  rationale: "...",           // gerekçe (kanıta bağlı)
  evidence: [{fact: "...", source: "..."}],  // her olgu KAYNAK ATFIYLA — atıfsız olgu reddedilir
  adaptation_notes: "...",    // neyi uyarla, ne kırılır
  risks: ["..."],             // en güçlü kill gerekçesi dahil
  confidence: low|med|high,   // analistin kendi belirsizliği
  validation_needed: [        // ZORUNLU Validation Block — en fazla 3, en kritik
    {data: "...",             //   hangi spesifik veri eksik (örn. "X pazarı CAC maliyeti")
     why: "...",              //   neden karar değiştirir
     how_to_verify: "..."}    //   nasıl doğrulanır (web / insan / mülakat)
  ],                          // yalnız confidence: high iken boş olabilir
  recommended_action: pursue|watch|kill
}
```

**Fit bant kuralı (0-100, katı):**

| Bant | Anlam | Kural |
|---|---|---|
| **80-100** | Teze birebir uyum (kovala-adayı) | Katı: yalnız mandate'e tam oturanlara **ve yalnız `confidence: high` ile** (güven kapısı) |
| **50-79** | Uyum var, kritik belirsizlik var (izle bandı) | `confidence: low/med` çıktının fit tavanı 79 |
| **0-49** | Uyumsuz / anti-pattern (ele bandı) | — |

- **Tutarlılık kuralı:** `recommended_action` bantla çelişemez (örn. fit 85 + kill yasak);
  çelişki zod-sonrası mantık kontrolünde reddedilir, analiz yeniden denenir.
- **Tazelik (freshness) skora karışmaz** — yalnız aynı bant içindeki fırsatları kendi içinde
  sıralayan tiebreaker'dır. Böylece eski-yüksek-skor, yeni-düşük-skoru ezemez (ve tersi).
- **Validation Block'un amacı:** "kanıt zayıf" deyip kaçmak yasak. Analist belirsizliği
  çözmez, *adreslenebilir kılar* — nereye bakılacağını adlandırır; nihai karar insanın.
  `validation_needed` dolu kayıtlar kuyrukta "doğrulama bekliyor" işaretiyle görünür.
- **Not (faz 2 adayı — sert kural):** gerekirse `confidence: low` için "kovala" tamamen
  yasaklanıp zorunlu izle'ye düşürülebilir; v1'de uygulanmaz, ileriye dönük not.

---

## 3. Kalibrasyon — iki ayrı set: golden few-shot + eval

**İki set birbirinden ayrıktır** — aynı vaka iki yerde olursa eval kendi kendini ölçer
(kontaminasyon). Toplam kurulum maliyeti: bir öğleden sonra. Otomatize framework yok; basit script.

### 3a. Golden few-shot seti (5-6 gerçek vaka — prompt'a girer)

Analistin yargısını hizalayan örnekler. Üretim = **co-creation**: network gerçek sinyalin ham
olgularını + tek-satır kovala/izle/ele kararını verir → asistan bunu tam yapılandırılmış analize
(arbitraj şeması) açar → network gerekçeyi düzeltir. Ground-truth etiketler network'ün, prose
emeği asistanın. Set en az 1 kovala, 1 ele, **1 izle** örneği içerir (izle kuralının nasıl
uygulandığını gösterir).

### 3b. Eval seti (tam 20 vaka: 7 kovala / 6 izle / 7 ele — few-shot'tan ayrık)

Prompt'u körlemesine ayarlamamanın tek yolu. ~14-15 vakayı asistan hazırlar — ama **sıfırdan
uydurmaz**: feed'lerden/webden *gerçek* geçmiş sinyaller seçer, taslak analiz + etiket önerir;
**insan her etiketi tek satırla onaylar/düzeltir** (döngüsellik mitigasyonu — AI hem vakayı hem
etiketi uydurursa eval kendi kendini ölçer). Çeşitlilik kotası:

- ≥2 anti-pattern tetikleyici (ele bandını test eder)
- ≥2 sınırda-izle (izle kuralını test eder)
- 1 tez-dışı-ama-ilginç
- 1-2 **mükerrer çift** (aynı şirket, iki farklı kaynak/metin) — naif dedup'un bilinçli stres
  testi: aynı sinyal → aynı aksiyon beklenir; tutarsızlık = model metin yüzeyine göre karar veriyor
- 1-2 **halüsinasyon probu** (kritik bilgisi bilerek eksik sinyal) — doğru davranış: bilinmeyeni
  işaretle + `validation_needed`; **uydurulmuş olgu tespit edilirse o vaka otomatik 0 puan**

### 3c. Metrik — ağırlıklı skor + confusion matrix

Basit örtüşme %'si her hatayı eşit sayar; oysa hatalar asimetrik (kovala↔ele karışması felaket,
izle'ye kayma tolere edilebilir):

- Tam eşleşme = **1.0** · komşu sınıfa kayma (kovala↔izle, izle↔ele) = **0.5** · zıt uç
  (kovala↔ele) = **0.0** → toplam/20 → 0-100 kalite skoru.
- **3×3 confusion matrix** yazdırılır — tek skor "ne kadar iyi"yi, matrix "**neyi düzelteceğini**"
  söyler: ele→kovala hücresi doluysa `anti_patterns` bastırmıyor; her şey izle'ye kaçıyorsa izle
  kuralı/Validation Block zorunluluğu sıkılaştırılır.
- Mükerrer çift tutarlılık kontrolü ayrı satırda raporlanır.

Aşağıdaki A/B iki taslaktır; ilk gerçek vakalarla değiştirilecek/genişletilecek.

### Örnek A — "KOVALA" (yüksek uyum)
> **Sinyal:** ABD'de B2B fatura/ön-muhasebe otomasyonu SaaS, KOBİ'lerde hızlı büyüme, kanıtlı tur.
> **Analiz:** *Kanıt* güçlü (büyüme + fonlama). *Yerel wedge:* TR KOBİ'lerinde e-fatura zorunluluğu
> + manuel ön-muhasebe acısı. *Uyarlama:* e-fatura/GİB entegrasyonu gerekir (kırılma noktası ama
> aşılabilir, regülasyon *engel değil tetikleyici*). *Zamanlama:* e-dönüşüm mevzuatı olgun. *Aksiyon:*
> **pursue**, fit 85/100, confidence high. *Risk:* yerel muhasebe yazılımı oyuncuları (işaretlendi).

### Örnek B — "ELE" (anti-pattern tetikledi)
> **Sinyal:** ABD'de lisanslı neobank, devasa tur.
> **Analiz:** *Kanıt* var ama `anti_patterns`: ağır bankacılık regülasyonu + büyük sermaye gereği.
> `capital_range` ve `risk_appetite` ile çelişir. *Uyarlama:* BDDK lisansı = yıllar + milyonlar.
> *Aksiyon:* **kill**, fit 15/100, confidence high. *Gerekçe:* mandate dışı; klasik yanlış pozitif.

---

### Sonraki adım
Bu somut tez onaylanırsa: değerleri `thesis.config` taslağına dök, arbitraj merceğini
`lenses.config`'e prompt şablonu olarak indir, örnekleri few-shot setine ekle (bkz. `PLAN.md`
bileşenleri). Yeni mercek (trend/beyaz-alan) sonradan aynı yapıya tek dosyayla eklenir.
