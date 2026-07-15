import type { Signal } from "./signal.js";

/**
 * Bilgi Katmanı (Knowledge Layer). v1'de interface arkasında BOŞ stub —
 * analist bağlamsız çalışır. gbrain/RAG implementasyonu faz 2 (bkz. PLAN.md §Bileşen 8).
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
