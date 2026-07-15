import type { EvalCase } from "./types.js";
import { makeSignal } from "./types.js";

/**
 * Eval seti — HEDEF: 20 vaka (7 kovala / 6 izle / 7 ele). Golden'dan AYRIK.
 * Kotalar: ≥2 anti-pattern tetikleyici, ≥2 sınırda-izle, 1 tez-dışı, 1-2 mükerrer-çift.
 * ~14-15'ini asistan gerçek geçmiş sinyallerden hazırlar → insan tek satırla onaylar.
 *
 * TODO(network): 20'ye tamamla. Aşağıdakiler tohum örnek (yapı gösterimi).
 */
export const evalCases: EvalCase[] = [
  {
    signal: makeSignal({
      title: "US vertical SaaS — restoran stok/israf yönetimi, KOBİ traction",
      summary_raw: "Restoranlar için AI stok tahmini; ABD'de büyüyor.",
      type: "company",
      market: "US",
      sector: "vertical SaaS",
    }),
    expected: "watch",
    note: "yerel wedge var ama TR ödeme isteği/CAC belirsiz → izle",
  },
  {
    signal: makeSignal({
      title: "US lisanslı dijital sağlık sigortası platformu — büyük tur",
      summary_raw: "Regüle sağlık sigortası, ağır lisans + sermaye.",
      type: "funding",
      market: "US",
      sector: "fintech",
    }),
    expected: "kill",
    note: "anti-pattern: ağır regülasyon + sermaye-ağır",
  },
];
