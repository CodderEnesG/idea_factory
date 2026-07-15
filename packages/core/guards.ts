import type { ArbitrageAnalysis } from "./lenses.config.js";
import { fitBand } from "./lenses.config.js";

/**
 * Zod-sonrası mantık guard'ları (PLAN.md §Bileşen 6). Şema geçerli ama karar
 * tutarsız olabilir — ihlal listesi dönerse analiz yeniden denenir.
 * Boş liste = geçti.
 */
export function checkArbitrageGuards(a: ArbitrageAnalysis): string[] {
  const v: string[] = [];

  // (a) bant-aksiyon tutarlılığı: fit bandı ile recommended_action çelişemez.
  const band = fitBand(a.fit);
  if (band !== a.recommended_action) {
    v.push(
      `bant-aksiyon çelişkisi: fit ${a.fit} (${band}) ama recommended_action=${a.recommended_action}`,
    );
  }

  // (b) güven kapısı: 80+ bandı yalnız confidence:high.
  if (a.fit >= 80 && a.confidence !== "high") {
    v.push(`güven kapısı: fit ${a.fit} ≥ 80 ama confidence=${a.confidence} (high olmalı)`);
  }

  // (c) atıfsız olgu / boş kanıt ile pursue reddi.
  if (a.recommended_action === "pursue" && a.evidence.length === 0) {
    v.push("pursue kanıtsız: evidence[] boş");
  }
  if (a.evidence.some((e) => e.source.trim() === "")) {
    v.push("atıfsız olgu: evidence[].source boş");
  }

  // (d) belirsizlik adreslenmeli: confidence high değilse validation_needed dolu olmalı.
  if (a.confidence !== "high" && a.validation_needed.length === 0) {
    v.push(`validation_needed boş: confidence=${a.confidence} iken en az 1 doğrulama adımı gerekli`);
  }
  // izle her zaman en az 1 validation_needed ister (izle = bekleme odası, çöp kutusu değil).
  if (a.recommended_action === "watch" && a.validation_needed.length === 0) {
    v.push("izle (watch) boş validation_needed ile geçersiz");
  }

  return v;
}
