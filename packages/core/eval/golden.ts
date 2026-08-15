import type { GoldenCase } from "./types.js";
import { makeSignal } from "./types.js";

/**
 * Golden few-shot seti (6) — prompt'a girer, yargıyı hizalar.
 * Co-creation: network ham olgu + tek-satır karar → asistan tam şemaya açar → network düzeltir.
 * 2 kovala / 2 izle / 2 ele — gerçek vakalar (Webrazzi taraması, 2026-07-18).
 * Eval setinden (cases.ts) AYRIK — aynı şirket iki sette olamaz (kontaminasyon).
 */
export const golden: GoldenCase[] = [
  // ── KOVALA ──────────────────────────────────────────────────────────────
  {
    signal: makeSignal({
      title: "Robom — Mükellef'in AI ön-muhasebe ürünü ilk yılında 3.000 kullanıcıya ulaştı",
      summary_raw:
        "Mükellef Technology'nin Nisan 2025'te lansmanladığı AI ön-muhasebe ürünü Robom, " +
        "ilk yılında ~3.000 kullanıcı ve ~1 milyon işleme ulaştı; %80'e varan zaman tasarrufu iddiası.",
      source: "fintechtime",
      type: "company",
      url: "https://fintechtime.com/2026/05/robom-ilk-yilinda-3000-kullaniciya-ve-1-milyona-yakin-isleme-ulasti/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 85,
      rationale:
        "Kanıtın iki ayağı da dolu: AI ön-muhasebe ABD'de kanıtlı dalga (QuickBooks AI, Digits, Bench) " +
        "VE ilk yıl TR traksiyonu yerel talebi ayrıca kanıtlıyor — kanıt asimetrisi zayıflığını kapatan nadir vaka. " +
        "Yerel wedge net: e-fatura zorunluluğu + KOBİ'de manuel muhasebe acısı. Sermaye-hafif B2B SaaS, tezle birebir.",
      evidence: [
        {
          fact: "İlk yılda ~3.000 kullanıcı ve ~1 milyon işlem",
          source: "https://fintechtime.com/2026/05/robom-ilk-yilinda-3000-kullaniciya-ve-1-milyona-yakin-isleme-ulasti/",
        },
        {
          fact: "AI ön-muhasebe kategorisi ABD'de kanıtlı (QuickBooks AI, Digits, Bench)",
          source: "web taraması 2026-07-18",
        },
      ],
      extra_note:
        "e-fatura/GİB entegrasyonu şart — kırılma noktası ama aşılabilir; regülasyon burada engel değil tetikleyici.",
      risks: ["Yerleşik muhasebe yazılımı oyuncuları (Logo, Mikro, Paraşüt)", "Mükellef'in ekosistem/dağıtım avantajı"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "pursue",
      tags: ["e-fatura", "kobi", "on-muhasebe"],
    },
  },
  {
    signal: makeSignal({
      title: "Visby AI — markaların LLM'lerdeki görünürlüğünü ölçüp aksiyona çeviren yerli platform",
      summary_raw:
        "Visby AI, markaların ChatGPT/Gemini/Claude'daki görünürlüğünü ölçüyor ve teknik görev/içerik " +
        "önerisine çeviriyor. 60+ aktif müşteri, son ayda %55 büyüme; $79/ay'dan başlayan abonelik. " +
        "Küresel rakipler: Profound, Peec AI.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/02/16/yerli-yapay-zeka-gorunurluk-platformu-visby-ai/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 81,
      rationale:
        "GEO/LLM-görünürlük küresel kanıtlı dalga (Profound, Peec AI) ve Visby yerel WTP'yi şimdiden kanıtlamış: " +
        "60+ ödeyen müşteri, net fiyat, %55 aylık büyüme. Sermaye-hafif B2B SaaS (teknik altyapı ~3 ayda kuruldu). " +
        "Zamanlama ideal: arama davranışı LLM'e kayarken markaların ölçüm ihtiyacı yeni doğuyor.",
      evidence: [
        {
          fact: "60+ aktif müşteri, son ayda %55 büyüme, $79/ay'dan başlayan abonelik",
          source: "https://webrazzi.com/2026/02/16/yerli-yapay-zeka-gorunurluk-platformu-visby-ai/",
        },
        {
          fact: "Kategori küresel kanıtlı — Profound ve Peec AI aynı işte fonlanmış rakipler",
          source: "https://webrazzi.com/2026/02/16/yerli-yapay-zeka-gorunurluk-platformu-visby-ai/",
        },
      ],
      extra_note:
        "TR pazarında Türkçe LLM cevapları + yerel marka verisi avantaj; kategori LLM sağlayıcıların arayüz/API değişimlerine bağımlı.",
      risks: ["Yerli alan kalabalıklaşıyor (Opttab da aynı işte)", "Kategori genç — LLM tarafındaki değişimlere bağımlılık"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "pursue",
      tags: ["geo", "llm-gorunurluk", "martech"],
    },
  },
  // ── İZLE ────────────────────────────────────────────────────────────────
  {
    signal: makeSignal({
      title: "Seemlyapp — yerli etkinlik ve sponsorluk zekası girişimi",
      summary_raw:
        "Ebru Şimşek Atlas'ın 2025'te kurduğu 2 kişilik bootstrap girişim; sponsorluk/etkinlik yatırımlarını " +
        "karar diline çeviriyor. ~10 ayda Türkiye ve İspanya'da 10+ kurumsal markanın 75+ etkinliğinde kullanıldı; " +
        "yıllık paket modeli.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/04/22/yerli-etkinlik-ve-sponsorluk-zekasi-girisimi-seemlyapp/",
      market: "TR",
      sector: "vertical SaaS",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 62,
      rationale:
        "Teze uyum sinyali güçlü: küresel emsal kanıtlı (SponsorUnited ~$35M topladı), vertical SaaS, sermaye-hafif, " +
        "erken kurumsal kullanım var. AMA kullanım ≠ gelir — ödeme/yenileme verisi gelmeden kovala denemez. " +
        "Kanıt gelirse kovala, gelmezse ele.",
      evidence: [
        {
          fact: "~10 ayda TR+İspanya'da 10+ kurumsal marka, 75+ etkinlik; yıllık paket modeli",
          source: "https://webrazzi.com/2026/04/22/yerli-etkinlik-ve-sponsorluk-zekasi-girisimi-seemlyapp/",
        },
        { fact: "Küresel emsal SponsorUnited ~$35M fonlama ile kanıtlı", source: "web taraması 2026-07-18" },
      ],
      extra_note: "TR sponsorluk ölçüm bütçeleri belirsiz; kurumsal satış döngüsü 2 kişilik ekibi zorlayabilir.",
      risks: ["Kullanım var ama ödeme kanıtı yok", "TR'de sponsorluk-ölçüm bütçesi küçük olabilir"],
      confidence: "med",
      validation_needed: [
        {
          data: "10+ markadan kaçının ödediği ve yıllık paketi yenilediği",
          why: "Kullanım ≠ gelir; yenileme oranı WTP'nin tek sert kanıtı — karar bunu bekliyor",
          how_to_verify: "Kurucuyla görüşme veya müşteri referans kontrolü",
        },
        {
          data: "TR sponsorluk-ölçüm pazarının yıllık bütçe boyutu",
          why: "Pazar bütçesi küçükse vertical SaaS tavanı düşük kalır",
          how_to_verify: "Ajans/marka tarafında 3-4 mülakat + sektör raporları",
        },
      ],
      recommended_action: "watch",
      tags: ["sponsorluk", "etkinlik", "vertical-saas"],
    },
  },
  {
    signal: makeSignal({
      title: "CallMetric AI — çağrı merkezi görüşmelerini yapay zeka ile analiz eden araç",
      summary_raw:
        "Bilsoft Yazılım'ın çağrı merkezi operasyonundan doğan CallMetric AI (2025), görüşmelerden performans, " +
        "duygu ve kalite analizi çıkarıyor. Türkçe ve yerinde veri işleme farkı; SaaS abonelik. Günde binlerce " +
        "çağrılık veri ana şirketten; makalede ödeyen müşteri/gelir rakamı yok.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/05/05/cagri-merkezi-gorusmelerini-yapay-zeka-ile-analiz-eden-arac-callmetric-ai/",
      market: "TR",
      sector: "B2B SaaS",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 58,
      rationale:
        "Kategori küresel kanıtlı (Gong, Observe.AI, NICE) ve yerel wedge gerçek: Türkçe dil desteği + KVKK'ya uygun " +
        "yerinde işleme. AMA tek bir ödeyen müşteri/gelir rakamı yok — eldeki veri ana şirket Bilsoft'un kendi " +
        "operasyonundan. Bağımsız ödeyen müşteri kanıtı gelirse kovala.",
      evidence: [
        {
          fact: "Türkçe + yerinde veri işleme farklılaşması; SaaS abonelik modeli; Gong/Observe.AI küresel emsal",
          source: "https://webrazzi.com/2026/05/05/cagri-merkezi-gorusmelerini-yapay-zeka-ile-analiz-eden-arac-callmetric-ai/",
        },
        {
          fact: "Makalede müşteri sayısı ve gelir rakamı yok; veri seti Bilsoft'un kendi çağrı merkezinden",
          source: "https://webrazzi.com/2026/05/05/cagri-merkezi-gorusmelerini-yapay-zeka-ile-analiz-eden-arac-callmetric-ai/",
        },
      ],
      extra_note: "TR çağrı merkezi pazarında yerleşikler (AloTech vb.) özellik olarak ekleyebilir — dağıtım kritik.",
      risks: ["Ödeyen müşteri kanıtı yok", "Yerleşik çağrı merkezi yazılımları aynı özelliği ekleyebilir"],
      confidence: "med",
      validation_needed: [
        {
          data: "Bilsoft dışında ödeyen müşteri sayısı ve gelir",
          why: "Ana şirket içi kullanım pazar talebini kanıtlamaz; bağımsız WTP kanıtı karar değiştirir",
          how_to_verify: "Şirketle görüşme + referans müşteri kontrolü",
        },
      ],
      recommended_action: "watch",
      tags: ["cagri-merkezi", "konusma-analitigi"],
    },
  },
  // ── ELE ─────────────────────────────────────────────────────────────────
  {
    signal: makeSignal({
      title: "microagi — fiziksel yapay zekanın veri sorununa çözüm arayan girişim",
      summary_raw:
        "Münih merkezli microagi (Ağustos 2025), humanoid robotik için VLA modelleri ve veri altyapısı geliştiriyor; " +
        "Zürih'te araştırma lab'ı, 7 ülkede operasyon, 2 ayda 35 çalışan. Silikon Vadisi ve Avrupa fonlarından " +
        "pre-seed; Temmuz 2026'da $55M yatırım.",
      source: "webrazzi",
      type: "company",
      url: "https://webrazzi.com/2026/04/02/fiziksel-yapay-zekanin-veri-sorununa-cozum-arayan-girisim-microagi/",
      market: "global",
      sector: "robotik",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 12,
      rationale:
        "Anti-pattern: sermaye-ağır + derin Ar-Ge. Humanoid robotik veri altyapısı araştırma lab'ı, çok ülkeli saha " +
        "operasyonu ve milyonlarca dolar ister — capital_range (~$0-100K) ve risk iştahı (derin Ar-Ge düşük) ile " +
        "doğrudan çelişir. Kanıt ne kadar güçlü olursa olsun mandate dışı.",
      evidence: [
        {
          fact: "Zürih araştırma lab'ı, 7 ülkede operasyon, 2 ayda 35 çalışan, pre-seed sonrası $55M tur",
          source: "https://webrazzi.com/2026/04/02/fiziksel-yapay-zekanin-veri-sorununa-cozum-arayan-girisim-microagi/",
        },
      ],
      extra_note: "Uyarlanacak bir şey yok — iş modelinin kendisi sermaye-ağır.",
      risks: ["sermaye-ağır", "derin Ar-Ge — risk iştahı dışı"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "kill",
      tags: ["robotik", "anti-pattern", "sermaye-agir"],
    },
  },
  {
    signal: makeSignal({
      title: "Midrise — menopoz sürecini yönetmeyi kolaylaştıran yerli uygulama",
      summary_raw:
        "Psikolog Dr. Gizem Sürenkök ve gazeteci Melis Alphan'ın kurduğu Midrise, 45-55 yaş kadınlar için 50+ " +
        "semptom takibi, öz-terapi ve AI sohbet sunan B2C mobil uygulama. Makalede fiyat, gelir modeli ve " +
        "kullanıcı sayısı yok.",
      source: "webrazzi",
      type: "launch",
      url: "https://webrazzi.com/2026/03/11/menopoz-surecini-yonetmeyi-kolaylastiran-yerli-uygulama-midrise/",
      market: "TR",
      sector: "healthtech",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 22,
      rationale:
        "Sektör dışı (B2C sağlık — mandate B2B SaaS/fintech/e-ticaret altyapısı/vertical SaaS) ve WTP belirsiz " +
        "anti-pattern'ı tam tetikleniyor: makalede fiyat da gelir modeli de yok. Üstüne hassas sağlık verisi " +
        "(KVKK özel nitelikli veri) yükü biner. İzlemeye alacak spesifik veri de tanımlanamıyor → ele.",
      evidence: [
        {
          fact: "B2C mobil uygulama; makalede fiyatlandırma, gelir modeli ve traksiyon verisi yok",
          source: "https://webrazzi.com/2026/03/11/menopoz-surecini-yonetmeyi-kolaylastiran-yerli-uygulama-midrise/",
        },
      ],
      extra_note: "TR'de B2C sağlık aboneliğinde ödeme isteği kanıtsız; hassas veri yükümlülükleri ek maliyet.",
      risks: ["WTP belirsiz (fiyat/model açıklanmamış)", "sektör dışı B2C", "hassas sağlık verisi yükümlülükleri"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "kill",
      tags: ["b2c", "healthtech", "wtp-belirsiz"],
    },
  },
];
