import type { EvalCase } from "./types.js";
import { makeSignal } from "./types.js";

/**
 * Eval seti — HEDEF: 20 vaka (7 kovala / 6 izle / 7 ele). Golden'dan (golden.ts) AYRIK.
 * Mevcut: 15 gerçek vaka (Webrazzi taraması + web araştırması, 2026-07-18), dağılım 3/7/5.
 * (Bounce Watch ×2 güven kapısı kuralı gereği izle'ye çekildi — kanıt bandı erken.)
 * Kotalar: ✓ ≥2 anti-pattern (MeshGrid, Fora, Muzica) · ✓ ≥2 sınırda-izle (Join, DBTalk, Caretta)
 *          ✓ 1 tez-dışı-ama-ilginç (Dronbul) · ✓ mükerrer-çift (Bounce Watch ×2)
 *          ✓ 1 halüsinasyon probu (Caretta — traksiyon verisi gerçekten yok)
 * TODO(network): 20'ye tamamla (+4 kovala, +2 ele; izle 7→6 için mükerrer çift kovala
 * tarafına taşınacak — plan: yeni kovala vakalarından birinin ikinci kaynağıyla çift kur,
 * BW'nin Tech.eu kopyası düşür). Her yeni etiket tek satırla insan onayı ister.
 */
export const evalCases: EvalCase[] = [
  // ── KOVALA (beklenen: pursue) ───────────────────────────────────────────
  {
    signal: makeSignal({
      title: "Faturaport — KOBİ'lere online fatura/ön-muhasebe SaaS'ının öne çıkan verileri",
      summary_raw:
        "Gaziantep merkezli Faturaport (2019, bootstrap): e-fatura, nakit akışı, cari ve İK takibi. " +
        "1.250 KOBİ / 4.000+ kullanıcı (2022'de 150 müşteriydi), günde 6.000+ e-fatura, %87 abonelik " +
        "yenileme, aylık %6 / yıllık %110 büyüme.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2025/11/12/yenilenen-faturaport-un-one-cikan-verileri/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "pursue",
    note: "Tezin Örnek A'sının canlısı: e-fatura wedge + %87 yenileme = WTP kanıtlı, sermaye-hafif",
  },
  {
    signal: makeSignal({
      title: "Madlen — öğretmen-öğrenci etkileşimini dijitalleştiren eğitim platformu",
      summary_raw:
        "Madlen (2024): okul gruplarına 40+ AI öğretmen aracı + Sokratik AI öğrenci asistanı. Ticari " +
        "lansmandan (Mayıs 2025) sonra 1 yılda $1M+ ARR; 16 okul grubu, 75+ kampüs, 50.000+ öğrenci, " +
        "20.000+ öğretmen. ~$1M yatırım (İş Bankası AI Factory, Global Scale Ventures); UK/MENA'ya açılıyor.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/05/12/egitim-teknolojileri-alaninda-ogretmen-ve-ogrenci-etkilesimini-dijitallestiren-platform-madlen/",
      market: "TR",
      sector: "vertical SaaS",
    }),
    expected: "pursue",
    note: "Vertical SaaS, 1 yılda $1M ARR = WTP kanıtlı; küresel emsal (MagicSchool AI) de kanıtlı",
  },
  {
    signal: makeSignal({
      title: "Bimetrik — e-ticaret satıcıları için AI destekli karar destek ve analiz platformu",
      summary_raw:
        "Hepsiburada kökenli kurucuların (Özge Karadaş, Erden Alpan) kurduğu Bimetrik: Trendyol/Hepsiburada " +
        "satıcılarına kârlılık, kampanya ve rakip takibi. Aralık 2025 lansmanından sonra 2 ayda ~40 müşteri, " +
        "sıfır pazarlama bütçesiyle; modüler SaaS abonelik. Hedef: 500.000+ TR pazaryeri satıcısı.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/02/12/e-ticaret-odaginda-yapay-zeka-destekli-karar-destek-ve-analiz-platformu-bimetrik/",
      market: "TR",
      sector: "e-ticaret altyapısı",
    }),
    expected: "pursue",
    note: "Sektör birebir; Amazon ekosisteminde kanıtlı model (Helium 10, Perpetua) + organik ilk traksiyon",
  },
  // ── İZLE (beklenen: watch) ──────────────────────────────────────────────
  {
    signal: makeSignal({
      title: "Bounce Watch — şirket sinyallerini karar motoruna çeviren yapay zeka ajanı",
      summary_raw:
        "Amsterdam merkezli, TR kurucu ekipli Bounce Watch (2023): istihdam/fonlama/lansman sinyallerini " +
        "izleyip aksiyona çeviriyor. Signal Tracker €79/ay, platform €499/ay; 50+ müşteri (Endeavor Turkey, " +
        "Revo Capital, UK Ticaret Bakanlığı). €250K pre-seed @ €2,5M; sonra €5M değerlemeyle SAFE köprüsü.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/05/04/sirket-sinyallerini-karar-motoruna-ceviren-yapay-zeka-ajani-bounce-watch/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    pairId: "bounce-watch",
    note: "Güven kapısı kuralı: kanıt bandı erken (pre-seed, €2,5M) → confidence med → izle; yenileme/büyüme verisi gelirse kovala",
  },
  {
    signal: makeSignal({
      title: "Bounce Watch, pazar kararları için istihbarat katmanı inşa ediyor",
      summary_raw:
        "Bounce Watch gerçek zamanlı şirket sinyallerini (işe alım, fonlama, ortaklık) yatırımcı ve satış " +
        "ekipleri için proaktif aksiyona çeviriyor. Abonelik + kullanım bazlı API modeli; 50'den fazla ödeyen " +
        "kurumsal müşteri. Kurucular Cem Ötkün ve Sedat Yusuf Ergüneş.",
      source: "tech.eu",
      type: "company",
      url: "https://tech.eu/2026/05/15/bounce-watch-building-the-intelligence-layer-for-faster-market-decisions/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    pairId: "bounce-watch",
    note: "Mükerrer çift: aynı şirket, farklı kaynak/metin — aynı aksiyon beklenir",
  },
  {
    signal: makeSignal({
      title: "SorsX — yapay zeka destekli işe alım platformu",
      summary_raw:
        "Waditek spin-off'u SorsX (2025, AJ Faraj): aday bulmadan AI mülakat ve skorlamaya uçtan uca işe alım. " +
        "TR/ABD/BAE'de aktif, '60+ kurumsal müşteri' iddiası — kaynakların tamamı aynı basın bülteninin " +
        "kopyaları, bağımsız doğrulama yok. Kategori küresel olarak kalabalık (HireVue, Paradox).",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/04/21/yapay-zeka-destekli-ise-alim-platformu-sorsx/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    note: "Traction tamamı kendi beyanı; bağımsız doğrulama gelirse kovala, farklılaşma çıkmazsa ele",
  },
  {
    signal: makeSignal({
      title: "Sesvia — işletmeler için yapay zeka destekli çağrı merkezi otomasyonu",
      summary_raw:
        "Solo kurucu Timur Tül'ün Sesvia'sı (Kasım 2025 kuruluş, Nisan 2026 canlı): KOBİ'lere AI sesli asistan. " +
        "Fiyat net: 2 TL/dk veya 799 TL/ay. Küresel kanıt güçlü (Bland, Retell, Synthflow); ama TR'de Sesla.ai, " +
        "asistanim.ai, Calltech aynı işte, AloTech gibi yerleşikler de özellik ekliyor. Ödeyen müşteri verisi yok.",
      source: "webrazzi",
      type: "launch",
      url: "https://webrazzi.com/2026/04/17/isletmeler-icin-yapay-zeka-destekli-cagri-merkezi-otomasyonu-sunan-platform-sesvia/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    note: "Küresel kanıt güçlü ama ödeyen müşteri yok + yerel alan kalabalıklaşıyor; WTP kanıtı gelirse kovala",
  },
  {
    signal: makeSignal({
      title: "DBTalk — veriye doğal dille anlık erişim sağlayan kurumsal platform",
      summary_raw:
        "Geobilgi'den doğan DBTalk (2023): kurumsal veriye doğal dille sorgu, saniyeler içinde tablo/grafik. " +
        "~15 kurumsal müşteri, onlarca sektörde POC; veriyi üçüncü taraf AI'a göndermeme (KVKK/on-prem) farkı. " +
        "Abonelik modeli, SaaS'a geçiş planlanıyor.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/02/17/veriye-dogal-ve-anlik-erisim-saglayan-platform-dbtalk/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    note: "Sınırda-izle: 15 ödeyen kurumsal var ama kategori hızla komoditize; POC→ücretli dönüşüm verisi bekleniyor",
  },
  {
    signal: makeSignal({
      title: "Join — şirketlerde çalışanlara yönelik marka iş birliklerini dijitalleştiren platform",
      summary_raw:
        "Fatih Mert Esmer'in Join'i (2024): çalışanlara marka ayrıcalıkları; 20 marka, 30+ ayrıcalık, " +
        "FlutterFlow ile no-code MVP. Şirketlere ücretsiz — gelir modeli satış komisyonu + reklam + etkinlik; " +
        "markalardan gelen gerçek gelir açıklanmamış. Küresel emsal: Perkbox, Reward Gateway.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2025/06/23/sirketler-icin-calisanlara-yonelik-marka-is-birliklerini-dijitallestiren-platform-join/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    note: "Sınırda-izle (izle kuralını test eder): küresel emsal kanıtlı ama markaların WTP'si kanıtsız — komisyon/reklam geliri var mı?",
  },
  {
    signal: makeSignal({
      title: "Caretta — satış ekiplerine gerçek zamanlı yapay zeka asistanı",
      summary_raw:
        "TR kökenli kurucuların San Francisco'ya taşıdığı Caretta (Kasım 2025): satış görüşmesi sırasında ürün/" +
        "rakip/müşteri bilgisi, sonrasında CRM ve takip otomasyonu. Y Combinator liderliğinde $1,3M yatırım. " +
        "Kullanıcı başı aylık abonelik. Müşteri sayısı, kullanım ve gelir verisi açıklanmamış.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/03/02/satis-ekiplerine-yonelik-yapay-zeka-cozumu-sunan-girisim-caretta/",
      market: "US",
      sector: "B2B SaaS",
    }),
    expected: "watch",
    note: "Halüsinasyon probu: traksiyon verisi gerçekten yok — doğru davranış bilinmeyeni işaretleyip validation_needed doldurmak; YC kanıtı tek başına kovala yapmaz",
  },
  // ── ELE (beklenen: kill) ────────────────────────────────────────────────
  {
    signal: makeSignal({
      title: "MeshGrid — altyapının çöktüğü saha koşulları için GSM'siz iletişim çözümü",
      summary_raw:
        "Toygar Dündaralp'in MeshGrid'i (Nisan 2026): LoRa/Bluetooth/GPS donanım node'u + iOS uygulamasıyla " +
        "şebekesiz iletişim. $12,99 tek seferlik lifetime uygulama; donanım için seri üretim yatırımı aranıyor. " +
        "Hedef: arama-kurtarma, saha ekipleri, off-grid kullanıcılar.",
      source: "webrazzi",
      type: "launch",
      url: "https://webrazzi.com/2026/06/02/altyapilarin-tamamen-coktugu-zorlu-saha-kosullari-icin-gelistirilen-iletisim-cozumu-meshgrid/",
      market: "TR",
      sector: "donanım",
    }),
    expected: "kill",
    note: "Anti-pattern: sermaye-ağır donanım + seri üretim; $12,99 lifetime = tekrarlayan gelir yok",
  },
  {
    signal: makeSignal({
      title: "Muzica — geleneksel enstrümanları destekleyen yerli AI müzik üretim platformu",
      summary_raw:
        "Reklam ajansı DokuzDoksan'ın 4 kişilik ekibinin ürünü Muzica: 33 tür, 40 enstrüman, makam estetiğini " +
        "koruyan AI müzik üretimi. ~3.000 aylık aktif kullanıcı; ücretsiz kredi + kredi paketi/Muzica+ " +
        "aboneliği (freemium). Hedef bireysel tüketici (yıldönümü, ninni, tezahürat).",
      source: "webrazzi",
      type: "launch",
      url: "https://webrazzi.com/2026/04/13/geleneksel-enstrumanlari-destekleyen-yerli-yapay-zeka-muzik-uretim-platformu-muzica/",
      market: "TR",
      sector: "consumer",
    }),
    expected: "kill",
    note: "Sektör dışı B2C + TR tüketicisinde eğlence WTP'si kanıtsız (anti-pattern: WTP belirsiz)",
  },
  {
    signal: makeSignal({
      title: "Rayİst — raylı sistemler için yapay zeka destekli ulaşım asistanı",
      summary_raw:
        "Solo geliştirici Erbil Özdemir'in Rayİst'i: İstanbul metro/Marmaray için canlı tren konumu, doluluk " +
        "tahmini, AI asistan. 57.000+ aktif kullanıcı, organik büyüme; model reklamsız temel + Premium abonelik, " +
        "ödeme verisi açıklanmamış. Tek şehir; kamu ulaşım verisine bağımlı.",
      source: "webrazzi",
      type: "launch",
      url: "https://webrazzi.com/2026/05/06/rayli-sistemler-icin-yapay-zeka-destekli-ulasim-asistani-rayist/",
      market: "TR",
      sector: "consumer",
    }),
    expected: "kill",
    note: "Sektör dışı B2C; 57K kullanıcı ≠ gelir (WTP belirsiz) + kamu verisine bağımlılık",
  },
  {
    signal: makeSignal({
      title: "Dronbul — profesyonel drone operasyon ağı",
      summary_raw:
        "Dronbul (Şubat 2026, 4 kişi): SHGM lisanslı drone operatörleriyle müşterileri buluşturan pazaryeri. " +
        "2,5 ayda 1.250 üye, 190 doğrulanmış operatör, 310 ilan, 32 ilde operasyon — reklamsız. Gelir: premium " +
        "üyelik kademeleri + jeton bazlı teklif sistemi. Balkanlar/Orta Doğu'ya genişleme hedefi.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/05/14/profesyonel-drone-operasyon-agi-dronbul/",
      market: "TR",
      sector: "pazaryeri",
    }),
    expected: "kill",
    note: "Tez-dışı-ama-ilginç: gerçek erken traksiyon var ama sektör dışı, ops-ağır hizmet pazaryeri — mandate'e girmiyor",
  },
  {
    signal: makeSignal({
      title: "Fora, 1 milyar dolar değerleme üzerinden 60 milyon dolar yatırım aldı",
      summary_raw:
        "ABD'li Fora (2021): bireylerin seyahat danışmanı olarak çalışmasını sağlayan platform — iletişim, " +
        "planlama, rezervasyon ve operasyon altyapısı. Series D $60M (Forerunner, Thrive); toplam $138,5M, " +
        "$1 milyar değerleme.",
      source: "webrazzi",
      type: "funding",
      url: "https://webrazzi.com/2026/07/17/fora-1-milyar-dolar-degerleme-uzerinden-60-milyon-dolar-yatirim-aldi/",
      market: "US",
      sector: "travel",
    }),
    expected: "kill",
    note: "Anti-pattern: sermaye-ağır network işi ($138,5M ile kurulan iki taraflı ağ) + sektör dışı",
  },
];
