/**
 * v1 tez konfigürasyonu — analistin "neyi iyi sayacağının" sabit zemini (mandate).
 * Değerler THESIS_AND_LENS.md §1 ile birebir. Versiyonlu.
 */
export interface ThesisConfig {
  version: string;
  capital_range: string;
  target_markets: string[];
  sectors: string[];
  capabilities: string[];
  risk_appetite: string;
  anti_patterns: string[];
}

export const thesis: ThesisConfig = {
  version: "v2",
  capital_range: "Minimal / sermaye-hafif (bootstrap-önce, ~$0–100K)",
  target_markets: ["Türkiye (birincil, ispat pazarı)", "global (genişleme)"],
  // v2 (2026-09-13): B2C eklendi — v1'in 4/4 B2B listesi fit≥80'de consumer'ı %3'e eziyordu.
  sectors: [
    "B2B SaaS",
    "fintech",
    "e-ticaret altyapısı",
    "vertical SaaS",
    "B2C tüketici uygulaması (sermaye-hafif)",
    "marketplace",
    "creator/topluluk ürünleri",
  ],
  capabilities: ["yazılım/ürün", "hızlı GTM", "yerel pazar erişimi"],
  risk_appetite: "Orta — kanıtlı model + yerel uyarlama; derin Ar-Ge düşük",
  anti_patterns: [
    "Ağır regülasyon (lisanslı bankacılık/sağlık)",
    "Ödeme isteği (WTP) belirsiz",
    "Sermaye-ağır (büyük ön yatırım gerektiren)",
    "İnce LLM sarmalayıcısı — değerin çoğu modelde; model sağlayıcı/platform bunu özellik olarak ekleyebilir (AI kullanmak tek başına sorun değil)",
  ],
};
