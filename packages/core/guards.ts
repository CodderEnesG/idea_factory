import type { BaseAnalysis } from "./lenses.config.js";
import { fitBand } from "./lenses.config.js";
import { isActionableKind, type SignalKind } from "./enrichment.js";

/** Guard'ların analiz dışında bakabildiği bağlam (zenginleştirmeden gelir). */
export interface GuardContext {
  signalKind?: SignalKind;
  /** Yalnız `lensId === "arbitrage"` iken (g) guard'ı devreye girer — diğer mercekler
   *  (white_space, custom) farklı kriterlere göre çalışır, bu kural onlara uygulanmaz. */
  lensId?: string;
  traction?: string | null;
  markets?: string[];
}

/** Kovalanamaz sinyal için fit tavanı — üstü "meta-öğrenme" rasyonalizasyonudur. */
export const NON_ACTIONABLE_FIT_CAP = 20;

/**
 * Zod-sonrası mantık guard'ları (PLAN.md §Bileşen 6). Şema geçerli ama karar
 * tutarsız olabilir — ihlal listesi dönerse analiz yeniden denenir.
 * Boş liste = geçti. Yalnız ortak alanlara (`BaseAnalysis`) bakar — her mercek
 * için aynı kurallar geçerli, mercek-özel guard gerekirse ayrıca eklenir.
 */
export function checkAnalysisGuards(a: BaseAnalysis, ctx: GuardContext = {}): string[] {
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

  // (e) ön kapı: ortada teşebbüs yoksa kovalanacak bir şey de yok. Analist görüş yazılarına
  // "meta-öğrenme değeri" gerekçesiyle fit 90 veriyordu — kuyruk deneme yazısıyla doluyordu.
  if (ctx.signalKind && !isActionableKind(ctx.signalKind)) {
    if (a.fit > NON_ACTIONABLE_FIT_CAP) {
      v.push(
        `ön kapı: signal_kind=${ctx.signalKind} (kovalanabilir teşebbüs yok) ama fit ${a.fit} > ${NON_ACTIONABLE_FIT_CAP}`,
      );
    }
    if (a.recommended_action !== "kill") {
      v.push(
        `ön kapı: signal_kind=${ctx.signalKind} için recommended_action=kill olmalı (gelen: ${a.recommended_action})`,
      );
    }
  }

  // (g) arbitraj tabanı: bu merceğin bütün mantığı "başka pazarda kanıtlanmış mı" (traction)
  // VE "Türkiye'de somut giriş noktası var mı" (wedge) sorularına dayanır (bkz. ARBITRAGE_SEED_LENS
  // questions[]). AI Yorumcusu 2026-08-19'da 25+ gerçek tartışmada tekrar tekrar aynı boşluğu
  // yakaladı: analist bu soruları soruyor ama cevabı fit'e yansıtmıyordu — "Traction: yok" olan
  // bir sinyal 88 alabiliyordu (bkz. PLAN.md §20). 80+ bandı için ikisinden EN AZ biri şart.
  if (ctx.lensId === "arbitrage" && a.fit >= 80) {
    const traction = ctx.traction?.trim() ?? "";
    const hasTraction = traction !== "" && !/^(yok|none|no traction|bilinmiyor)$/i.test(traction);
    const hasTrWedge = (ctx.markets ?? []).some((m) => /türkiye|turkey|\btr\b|mena/i.test(m));
    if (!hasTraction && !hasTrWedge) {
      v.push(
        "arbitraj tabanı eksik: ne başka pazarda kanıt (traction) ne TR/MENA wedge'i var — fit 80+ olamaz",
      );
    }
  }

  return v;
}
