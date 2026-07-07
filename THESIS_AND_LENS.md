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

### Çıktı şeması (kavramsal — `AI_ANALYST.md §5` ile uyumlu)
```
{
  lens: "arbitrage",
  fit: 0-10,                  // teze uyum
  rationale: "...",           // gerekçe (kanıta bağlı)
  evidence: ["kaynak..."],    // olgu, atfıyla
  adaptation_notes: "...",    // neyi uyarla, ne kırılır
  risks: ["..."],             // en güçlü kill gerekçesi dahil
  confidence: low|med|high,   // analistin kendi belirsizliği
  recommended_action: pursue|watch|kill
}
```

---

## 3. Kalibrasyon — altın-standart örnekler + eval

Analistin yargısını hizalayan örnekler. **v1 hedefi: 5-6 örnek.** Üretim süreci: **network gerçek
sinyal + tek-satır kovala/izle/ele kararı verir → asistan bunu tam yapılandırılmış analize (arbitraj
şeması) açar → network gerekçeyi düzeltir.** Böylece ground-truth etiketler network'ün, prose emeği
asistanın.

Bu 5-6 örnek aynı zamanda **eval setinin çekirdeği**: minimal harness = analisti N sinyalde koştur →
`recommended_action`'ı insan etiketiyle kıyasla → örtüşme %'sine bak. **Leave-one-out** kullan (test
edilen örneği few-shot'tan çıkar, sırayla döndür). Dürüst uyarı harness çıktısına yazılır: küçük ve
few-shot'la örtüşen bir setle örtüşme %'si "analist örnekleri izliyor mu"yu ölçer, *genelleme*yi değil.
v1'de kabul; set gerçek sinyallerle büyüdükçe anlam kazanır (8-10 vaka hedefe iyi bir başlangıç).

Aşağıdaki A/B iki taslaktır; ilk gerçek vakalarla değiştirilecek/genişletilecek.

### Örnek A — "KOVALA" (yüksek uyum)
> **Sinyal:** ABD'de B2B fatura/ön-muhasebe otomasyonu SaaS, KOBİ'lerde hızlı büyüme, kanıtlı tur.
> **Analiz:** *Kanıt* güçlü (büyüme + fonlama). *Yerel wedge:* TR KOBİ'lerinde e-fatura zorunluluğu
> + manuel ön-muhasebe acısı. *Uyarlama:* e-fatura/GİB entegrasyonu gerekir (kırılma noktası ama
> aşılabilir, regülasyon *engel değil tetikleyici*). *Zamanlama:* e-dönüşüm mevzuatı olgun. *Aksiyon:*
> **pursue**, fit 8/10, confidence high. *Risk:* yerel muhasebe yazılımı oyuncuları (işaretlendi).

### Örnek B — "ELE" (anti-pattern tetikledi)
> **Sinyal:** ABD'de lisanslı neobank, devasa tur.
> **Analiz:** *Kanıt* var ama `anti_patterns`: ağır bankacılık regülasyonu + büyük sermaye gereği.
> `capital_range` ve `risk_appetite` ile çelişir. *Uyarlama:* BDDK lisansı = yıllar + milyonlar.
> *Aksiyon:* **kill**, fit 2/10, confidence high. *Gerekçe:* mandate dışı; klasik yanlış pozitif.

---

### Sonraki adım
Bu somut tez onaylanırsa: değerleri `thesis.config` taslağına dök, arbitraj merceğini
`lenses.config`'e prompt şablonu olarak indir, örnekleri few-shot setine ekle (bkz. `PLAN.md`
bileşenleri). Yeni mercek (trend/beyaz-alan) sonradan aynı yapıya tek dosyayla eklenir.
