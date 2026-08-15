import type { CustomAnalysis, RankedItem } from "@idea-factory/core";

const d1Arbitrage: CustomAnalysis = {
  lens: "arbitrage",
  fit: 84,
  rationale:
    "Kanıt güçlü (büyüme + fonlama). Yerel wedge: TR KOBİ'lerinde e-fatura zorunluluğu + manuel ön-muhasebe acısı. Regülasyon engel değil tetikleyici.",
  evidence: [{ fact: "ABD'de kanıtlı tur", source: "producthunt" }],
  extra_note: "e-fatura/GİB entegrasyonu gerekir; aşılabilir kırılma noktası.",
  risks: ["yerel muhasebe yazılımı oyuncuları"],
  confidence: "high",
  validation_needed: [],
  recommended_action: "pursue",
  tags: ["e-fatura", "kobi"],
};

const d1WhiteSpace: CustomAnalysis = {
  lens: "white_space",
  fit: 70,
  rationale:
    "TR'de doğrudan aynı segmenti hedefleyen olgun bir oyuncu görünmüyor; birkaç genel muhasebe yazılımı dolaylı rakip.",
  evidence: [{ fact: "arama sonuçlarında net bir 1:1 rakip yok", source: "web_search" }],
  extra_note:
    "Genel muhasebe yazılımları (Logo, Mikro) segmenti kısmen kapsıyor ama AI-ön-muhasebeye odaklı değil.",
  risks: ["mevcut oyuncular hızla özellik ekleyebilir"],
  confidence: "med",
  validation_needed: [
    {
      data: "son 12 ayda TR'de benzer konumlanan yeni girişim var mı",
      why: "boşluğun kapanma hızını gösterir",
      how_to_verify: "web_search + fon takibi",
    },
  ],
  recommended_action: "watch",
  tags: ["e-fatura", "kobi"],
};

const d2Arbitrage: CustomAnalysis = {
  lens: "arbitrage",
  fit: 63,
  rationale: "Yerel wedge var (restoran zincirleri) ama TR ödeme isteği ve CAC belirsiz.",
  evidence: [{ fact: "ABD'de büyüme sinyali", source: "producthunt" }],
  extra_note: "yerel POS entegrasyonları; küçük işletme fiyat hassasiyeti.",
  risks: ["düşük ödeme isteği olabilir"],
  confidence: "med",
  validation_needed: [
    {
      data: "TR restoran zincirlerinde stok-israf maliyeti",
      why: "ödeme isteğini belirler, kovala/ele'yi çevirir",
      how_to_verify: "3-5 zincir operasyon müdürüyle mülakat",
    },
  ],
  recommended_action: "watch",
  tags: ["restoran", "vertical"],
};

const d3Arbitrage: CustomAnalysis = {
  lens: "arbitrage",
  fit: 14,
  rationale:
    "Anti-pattern: ağır bankacılık regülasyonu + büyük sermaye gereği. capital_range ve risk_appetite ile çelişir.",
  evidence: [{ fact: "lisanslı neobank + devasa tur", source: "producthunt" }],
  extra_note: "BDDK lisansı yıllar + milyonlar; mandate dışı.",
  risks: ["ağır regülasyon", "sermaye-ağır"],
  confidence: "high",
  validation_needed: [],
  recommended_action: "kill",
  tags: ["neobank", "anti-pattern"],
};

/** Backend yokken kuyruğu göstermek için örnek veri (Supabase env gelince kullanılmaz). */
export const DEMO_ITEMS: RankedItem[] = [
  {
    signal: {
      id: "d1",
      source: "producthunt",
      type: "launch",
      title: "US B2B fatura otomasyonu SaaS — KOBİ'lerde hızlı büyüme",
      url: "https://example.com/invoice-ai",
      summary_raw: "ABD KOBİ pazarında kanıtlı tur almış fatura/ön-muhasebe otomasyonu.",
      market: "US",
      sector: "B2B SaaS",
      posted_at: "2026-07-14T00:00:00Z",
      fetched_at: "2026-07-15T00:00:00Z",
      content_hash: "d1",
    },
    analyses: { arbitrage: d1Arbitrage, white_space: d1WhiteSpace },
  },
  {
    signal: {
      id: "d2",
      source: "producthunt",
      type: "company",
      title: "US restoran stok/israf yönetimi — AI tahmin",
      url: "https://example.com/resto-ai",
      summary_raw: "Restoranlar için AI stok tahmini; ABD'de büyüyor.",
      market: "US",
      sector: "vertical SaaS",
      posted_at: "2026-07-13T00:00:00Z",
      fetched_at: "2026-07-15T00:00:00Z",
      content_hash: "d2",
    },
    analyses: { arbitrage: d2Arbitrage },
  },
  {
    signal: {
      id: "d3",
      source: "producthunt",
      type: "funding",
      title: "US lisanslı neobank — devasa tur",
      url: "https://example.com/neobank",
      summary_raw: "ABD'de lisanslı neobank, büyük sermaye turu.",
      market: "US",
      sector: "fintech",
      posted_at: "2026-07-12T00:00:00Z",
      fetched_at: "2026-07-15T00:00:00Z",
      content_hash: "d3",
    },
    analyses: { arbitrage: d3Arbitrage },
  },
];
