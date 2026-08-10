import {
  analyzeSignal,
  type FewShotExample,
  type KnowledgeLayer,
  type Lens,
  type Signal,
  type ThesisConfig,
} from "@idea-factory/core";
import { db } from "../db.js";
import { env } from "../env.js";

export interface AnalyzeOneDeps {
  fewShot: FewShotExample[];
  knowledge: KnowledgeLayer;
  thesis: ThesisConfig;
}

/**
 * Tek sinyali tek mercekle analiz edip `analyses`'e yazar. `analyze.ts` (yeni-pencere kısa
 * listesi) ve `backfill-lens.ts` (geçmişe dönük tarama) aynı adımı paylaşsın diye çıkarıldı —
 * iki farklı upsert yolu = iki farklı bug demekti.
 *
 * Hata yutulur (loglanır, false döner): tek sinyalin LLM/DB hatası partiyi düşürmemeli, satır
 * yazılmadığı için sonraki koşuda otomatik yeniden denenir (`triage.ts` deseni).
 */
export async function analyzeOne(signal: Signal, lens: Lens, deps: AnalyzeOneDeps): Promise<boolean> {
  try {
    const a = await analyzeSignal(signal, lens, {
      fewShot: deps.fewShot,
      knowledge: deps.knowledge,
      thesis: deps.thesis,
    }); // mercek-özel çapalar + ekip geçmişi + env provider/model + aktif tez
    const { error } = await db.from("analyses").upsert(
      {
        signal_id: signal.id,
        lens: a.lens,
        fit: a.fit,
        rationale: a.rationale,
        evidence: a.evidence,
        adaptation_notes: lens.extraNote(a),
        risks: a.risks,
        confidence: a.confidence,
        validation_needed: a.validation_needed,
        recommended_action: a.recommended_action,
        tags: a.tags,
        model: env.analysisModel(),
      },
      { onConflict: "signal_id,lens" },
    );
    if (error) throw new Error(error.message);
    console.log(`  ✓ ${a.recommended_action} fit=${a.fit} — ${signal.title.slice(0, 60)}`);
    return true;
  } catch (e) {
    console.error(`  ✗ ${signal.url}:`, e instanceof Error ? e.message : e);
    return false;
  }
}
