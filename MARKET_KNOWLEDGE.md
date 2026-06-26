# Idea Factory — Analist AI'nin Pazar Bilgisi ("Eğitme" = Grounding)

> **Bu dokümanın yeri:** `AI_ANALYST.md`'deki persona felsefesini **pazar bilgisi** katmanıyla
> tamamlar. Soru: analist AI pazarı *nasıl tanır* ve onu *nasıl yönlendiririz/"eğitiriz"*?
> Strateji/felsefe seviyesi; somut prompt/şema implementasyona bırakılır.

---

## 0. Tek cümlede — en kritik karar

Analist AI'yi **biz fine-tune ETMEYİZ.** Claude'da (kullandığımız model) genel bir fine-tuning
yüzeyi yoktur; pazar bilgisi tamamen **grounding (bağlam mühendisliği)** ile gelir. "Eğitme"
dediğimiz şey, model ağırlıklarını değiştirmek değil; **doğru bilgiyi doğru anda bağlama enjekte
etmektir.**

Bu bir kısıt değil, **avantaj**:

| | Fine-tuning (yapmıyoruz) | Grounding (yapıyoruz) |
|---|---|---|
| Güncelleme hızı | Haftalar, yeniden eğitim | **Dakikalar** — veri/config değişir |
| Denetlenebilirlik | Kara kutu | **Şeffaf** — hangi bilgi kullanıldı görünür |
| Müşteri-başına özelleştirme | Ayrı model/maliyet | **Ücretsiz** — her tenant kendi bağlamı |
| Tazelik | Eğitim anında donar | **Canlı** — web + bilgi tabanı her zaman güncel |
| Yanlışı düzeltme | Yeniden eğitim | Tek kaydı düzelt / örnek ekle |

Yani "pazarı tanıyan özelleştirilmiş AI" = **özel ağırlıklı model değil, özel bağlamlı analist.**

---

## 1. Beş bilgi katmanı (en kalıcıdan en tazeye)

Analistin "bildiği" her şey bu beş katmandan birinden gelir. Hepsi **veri/konfigürasyon** — kod
değil — yani değiştirmek yeni model değil, yeni ayar gerektirir.

### Katman 1 — Tez konfigürasyonu (en kalıcı zemin)
"Kim olduğumuz, neyi kovaladığımız." Sermaye aralığı, hedef pazarlar, sektörler, yetkinlikler,
risk iştahı, anti-pattern'ler. Bu, analistin *neyi iyi sayacağının* sabit zemini. Bir fonun
yatırım mandası gibi. (Bkz. `THESIS_AND_LENS.md` — somut Türkiye/MENA değerleri.)

### Katman 2 — Küratörlü bilgi tabanı (RAG — asıl "pazar hafızası")
Analistin uzun-vadeli hafızası. **gstack `gbrain` (Supabase + `pgvector`)** omurga: geçmiş
sinyaller, şirketler, kurucular, fonlama olayları, pazar/regülasyon notları embedding'lenip
kalıcı tabana yazılır. Analiz anında, sinyalle **semantik olarak en alakalı** geçmiş bağlam
çekilip prompt'a enjekte edilir (RAG — retrieval-augmented generation).

Bu sayede analist "bu fikri daha önce gördük mü? kim denedi? ne oldu? bu pazarda regülasyon
nasıl?" sorularını **uydurmadan**, kayıtlı bilgiyle cevaplar. Bilgi compound eder: her analiz
tabanı zenginleştirir, sonraki analizler daha derinleşir.

### Katman 3 — Canlı pazar bilgisi (taze olgular)
Bilgi tabanı geçmişi tutar; **bugünü** Anthropic'in server-tool'ları getirir:
- **`web_search`** — taze olgu/haber ("bu şirket yeni tur aldı mı? rakip çıktı mı?").
- **`web_fetch`** — bilinen bir URL'in içeriğini çekme.

Analist, kanaat üretmeden önce eksik/eskimiş olabilecek olguyu canlı doğrular. Bu, "eğitim verisi
kesim tarihi" sorununu ortadan kaldırır — model ne zaman eğitilmiş olursa olsun, pazar bilgisi
gerçek-zamanlı.

### Katman 4 — Altın-standart örnekler (few-shot — yargı hizalama)
Analiste *neyin iyi bir analiz olduğunu* gösteren örnekler: hem "kovala" hem "ele" için
gerekçeli vaka analizleri. Bu, modelin **tonunu** değil **yargısını** hizalar — networkün neyi
fırsat sayıp neyi saymadığını örnekten öğrenir. (İlk set elle küratörlenir; zamanla insan
kararları yeni örneklere dönüşür — bkz. Katman 5.)

### Katman 5 — Memory (oturumlar-arası öğrenme)
Anthropic **memory tool** + karar geri-besleme döngüsü: analist kullanıldıkça öğrendiğini
(düzeltmeler, doğrulanmış yaklaşımlar, networkün tercihleri) kalıcı bir hafıza dosyasına yazar ve
sonraki oturumlarda okur. "Bu sektörde geçen ay şu yanlış pozitifi gördük" gibi dersler birikir.

> **Özet:** Katman 1 *kim olduğumuz*, Katman 2 *ne hatırladığımız*, Katman 3 *bugün ne olduğu*,
> Katman 4 *neyin iyi olduğu*, Katman 5 *ne öğrendiğimiz*. Hiçbiri model ağırlığı değil — hepsi
> bağlam.

---

## 2. Yerel pazar derinliği (Türkiye/MENA'yı "tanımak")

Arbitraj merceğinin can damarı, analistin **yerel pazarı gerçekten tanıması**. Bu, modele "sen
Türkiye uzmanısın" demekle olmaz (o sadece tondur). Gerçek tanıma, bilgi tabanına (Katman 2)
**küratörlenmiş, kaynaklı** yerel bilgiyle gelir:

- **Regülasyon** — lisanslama, veri/KVKK, sektörel kısıtlar (fintech/sağlık özellikle).
- **Ödeme altyapısı** — kart penetrasyonu, yerel ödeme yöntemleri, BDDK/banka dinamikleri.
- **Dağıtım kanalları** — hangi kanal işler (sosyal, marketplace, saha), CAC gerçekleri.
- **Tüketici davranışı & ödeme isteği** — fiyat hassasiyeti, yerel alışkanlıklar.
- **Yerel ikameler & rekabet** — "bu zaten X tarafından yapılıyor mu?".

**Altın kural:** analist bilmediğini **uydurmaz**; bilinmeyeni *bilinmeyen* olarak işaretler ve
"şunu doğrula / araştır" aksiyonu önerir (canlı web ya da insan). Olgu ile çıkarım her zaman ayrı
(`AI_ANALYST.md §3.3`).

---

## 3. Maliyet & performans (grounding'i ucuz tutmak)

- **Prompt caching** — büyük, stabil bilgi-prefix'i (tez + sabit pazar bilgisi) bir kez yazılıp
  cache'lenir; tekrar eden analizlerde ~0.1× maliyetle okunur. Stabil içeriği önde, değişken
  sinyali sonda tut.
- **Kademeli model** — tüm sinyaller ucuz toplu modelle (**`claude-sonnet-4-6`**) ön-elenir;
  yalnız kısa liste pahalı modele (**`claude-opus-4-8`**) gider. Persona aynı, efor kademeli.
- **RAG = seçici enjeksiyon** — tüm bilgi tabanını değil, sinyalle alakalı parçayı çekeriz
  (bağlam şişmez, maliyet düşer).
- **Context-editing / compaction** — uzun oturumlarda eski tool sonuçlarını/bağlamı temizler.

---

## 4. Güven (pazar bilgisi gürültüden nasıl ayrılır)

- **Olgu/çıkarım ayrımı + kaynak atfı** — "bilgi tabanı/web şunu diyor" vs "ben şunu tahmin
  ediyorum"; her olgu kaynağıyla.
- **Güven düzeyi** her çıktıda; analist emin değilse söyler (`AI_ANALYST.md §3.4, §8`).
- **Doğrulama döngüsü** — bilinmeyen → web/insan doğrulaması önerisi; kanaat kanıta bağlanır.
- **İnsan geri-beslemesi** zamanla isabeti ölçer (North Star: kovala→doğrulandı hit-rate).

---

### Sonraki adım
Bu felsefe onaylanırsa somut karşılığı: `gbrain` kurulumu (`/setup-gbrain`), bilgi tabanı şeması,
web-tool entegrasyonu ve few-shot örnek setinin küratörlenmesi. Tez ve mercek somutu için bkz.
`THESIS_AND_LENS.md`.
