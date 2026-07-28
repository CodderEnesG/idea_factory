import type { Signal } from "./signal.js";

/**
 * Bilgi Katmanı (Knowledge Layer). v1'de interface arkasında BOŞ stub —
 * analist bağlamsız çalışır. gbrain/RAG implementasyonu faz 2 (bkz. PLAN.md §Bileşen 8).
 *
 * TODO (feedback wiring — ekip incelemesi turu topluyor, bağlamıyor): gelecek turda
 * getContext(signal) → aynı sektör/pazardaki insan kararlarını (decisions.decided_by +
 * decision) + yorumlarını (comments) `{notes}` olarak döndürecek. Enjeksiyon noktası
 * analyst.ts:69 ("İlgili geçmiş bağlam") zaten hazır — böylece analist ekip kalibrasyonundan
 * öğrenir. Bu tur SADECE veri biriktiriliyor (per-user decided_by + comments); kod değişmez.
 */
export interface KnowledgeContext {
  notes: string[]; // ilgili geçmiş bağlam (v1: boş)
}

export interface KnowledgeLayer {
  getContext(signal: Signal): Promise<KnowledgeContext>;
}

export const emptyKnowledgeLayer: KnowledgeLayer = {
  async getContext(_signal: Signal): Promise<KnowledgeContext> {
    return { notes: [] };
  },
};
