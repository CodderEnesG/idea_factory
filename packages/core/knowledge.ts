import type { Signal } from "./signal.js";

/**
 * Bilgi Katmanı (Knowledge Layer) arayüzü. Gerçek gbrain/RAG (embedding + semantik arama)
 * faz 2 (bkz. PLAN.md §Bileşen 8) — burada framework-bağımsız kalması gereken interface +
 * test/varsayılan için boş stub duruyor.
 *
 * Gerçek implementasyon (aynı sektör/pazardaki `decisions` + `comments`'ten `{notes}`
 * derleyen SQL-tabanlı sürüm): `apps/worker/src/lib/knowledge-db.ts` (`supabaseKnowledgeLayer`).
 * Enjeksiyon noktası: analyst.ts:69 ("İlgili geçmiş bağlam").
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
