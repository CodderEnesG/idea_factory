/**
 * Aşama başına model seçimi (kademeli model — Faz 2 dilim 3). Toplu/ucuz aşamalar (enrich,
 * triage) ile karar üreten aşamalar (analyze, debate) farklı modelde koşabilsin diye.
 *
 * `ENRICH_MODEL` / `TRIAGE_MODEL` / `ANALYZE_MODEL` / `DEBATE_MODEL` set değilse undefined döner
 * → sağlayıcı kendi varsayılanına düşer (GEMINI_MODEL / ANALYSIS_MODEL), davranış değişmez.
 * Geri almak = env'i silmek; kod değişmez.
 */
export type ModelStage = "enrich" | "triage" | "analyze" | "debate";

const ENV_BY_STAGE: Record<ModelStage, string> = {
  enrich: "ENRICH_MODEL",
  triage: "TRIAGE_MODEL",
  analyze: "ANALYZE_MODEL",
  debate: "DEBATE_MODEL",
};

export function stageModel(stage: ModelStage): string | undefined {
  const v = process.env[ENV_BY_STAGE[stage]]?.trim();
  return v ? v : undefined;
}
