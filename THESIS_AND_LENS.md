# Idea Factory — Somut İlk Tez + Arbitraj Merceği

> **Bu dokümanın yeri:** `AI_ANALYST.md` (persona) ve `MARKET_KNOWLEDGE.md` (grounding) felsefesini
> **somuta** indirir: ilk tez konfigürasyonunun gerçek değerleri + arbitraj merceğinin tam soru
> çerçevesi. Şablon değerler **başlangıç taslağıdır** — sermaye/sektör gibi alanları kullanıcı
> (network) kendi gerçeğiyle doldurur.

---

## 1. İlk tez: Türkiye/MENA arbitraj mandası

Tez = analistin "neyi iyi sayacağının" sabit zemini (mandate). Aşağıdaki değerler **temsili
taslaktır**; her satır network'ün gerçeğiyle güncellenmeli.

| Alan | Temsili başlangıç değeri (DOLDUR) | Neden önemli (analist bunu nasıl kullanır) |
|---|---|---|
| `capital_range` | ~$25K–$250K tohum/bootstrap | Kovalanabilir fırsatı sermaye gerçeğine göre eler; "100M$ gerektiren" fikri baştan düşürür |
| `target_markets` | Türkiye (birincil), MENA (genişleme) | Arbitraj hedefi; uyarlama analizinin yapılacağı pazar |
| `sectors` | B2B SaaS, fintech, e-ticaret altyapısı, vertical SaaS | Odak; dışı düşük öncelik (ama "tez-dışı ama ilginç" kovası açık kalır) |
| `capabilities` | Yazılım/ürün, hızlı GTM, yerel pazar erişimi | "Bizim yapabileceğimiz" işi öne çıkarır; yetkinlik dışını işaretler |
| `risk_appetite` | Orta — kanıtlı model + yerel uyarlama; derin Ar-Ge düşük | Erken/riskli vs kanıtlı fırsat dengesini ayarlar |
| `anti_patterns` | Ağır regülasyon (lisanslı bankacılık/sağlık), tek-şehir hikâyesi, ödeme isteği belirsiz, network-effect'siz pazaryeri | Bilinen yanlış pozitifleri **baştan bastırır** — en güçlü kalibrasyon |

> **Not:** `anti_patterns` listesi zamanla en değerli varlık olur — her yanlış pozitif buraya
> eklenir, analist bir daha aynı tuzağa düşmez (bkz. `MARKET_KNOWLEDGE.md` Katman 5).

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

## 3. Kalibrasyon — altın-standart örnekler (taslak)

Analistin yargısını hizalayan örnekler. İlk set elle küratörlenir; gerçek vakalarla değiştirilmeli.

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
