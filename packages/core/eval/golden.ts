import type { GoldenCase } from "./types.js";
import { makeSignal } from "./types.js";

/**
 * Golden few-shot seti (5-6) — prompt'a girer, yargıyı hizalar.
 * Co-creation: network ham olgu + tek-satır karar → asistan tam şemaya açar → network düzeltir.
 * En az 1 kovala / 1 izle / 1 ele. Eval setinden AYRIK (kontaminasyon yok).
 *
 * TODO(network): gerçek vakalarla doldur. Aşağıdaki 2 örnek THESIS_AND_LENS §3'ten taslak.
 */
export const golden: GoldenCase[] = [
  {
    signal: makeSignal({
      title: "US B2B fatura/ön-muhasebe otomasyonu SaaS — KOBİ'lerde hızlı büyüme",
      summary_raw: "ABD KOBİ pazarında hızlı büyüyen, kanıtlı tur almış fatura otomasyonu.",
      type: "company",
      market: "US",
      sector: "B2B SaaS",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 82,
      rationale:
        "Kanıt güçlü (büyüme + fonlama). Yerel wedge: TR KOBİ'lerinde e-fatura zorunluluğu + manuel ön-muhasebe acısı. Regülasyon engel değil tetikleyici.",
      evidence: [{ fact: "ABD'de kanıtlı tur + KOBİ büyümesi", source: "sinyal" }],
      adaptation_notes: "e-fatura/GİB entegrasyonu gerekir (aşılabilir kırılma noktası).",
      risks: ["yerel muhasebe yazılımı oyuncuları"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "pursue",
      tags: ["e-fatura", "kobi"],
    },
  },
  {
    signal: makeSignal({
      title: "US lisanslı neobank — devasa tur",
      summary_raw: "ABD'de lisanslı neobank, büyük sermaye turu.",
      type: "funding",
      market: "US",
      sector: "fintech",
    }),
    analysis: {
      lens: "arbitrage",
      fit: 15,
      rationale:
        "Kanıt var ama anti_patterns: ağır bankacılık regülasyonu + büyük sermaye gereği. capital_range ve risk_appetite ile çelişir. BDDK lisansı = yıllar + milyonlar.",
      evidence: [{ fact: "lisanslı neobank + devasa tur", source: "sinyal" }],
      adaptation_notes: "BDDK lisansı yıllar alır; mandate dışı.",
      risks: ["ağır regülasyon", "sermaye-ağır"],
      confidence: "high",
      validation_needed: [],
      recommended_action: "kill",
      tags: ["neobank", "anti-pattern"],
    },
  },
];
