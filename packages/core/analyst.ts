import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ArbitrageAnalysisSchema,
  buildArbitrageSystemPrompt,
  buildArbitrageUserPrompt,
  type ArbitrageAnalysis,
} from "./lenses.config.js";
import { thesis as defaultThesis, type ThesisConfig } from "./thesis.config.js";
import { checkArbitrageGuards } from "./guards.js";
import { emptyKnowledgeLayer, type KnowledgeLayer } from "./knowledge.js";
import { StoredEnrichmentSchema } from "./enrichment.js";
import type { Signal } from "./signal.js";
import type { AnalystProvider } from "./providers/types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { AnthropicProvider } from "./providers/anthropic.js";

/** Golden few-shot çapası: bir sinyal + onun onaylı analizi. */
export interface FewShotExample {
  signal: Pick<Signal, "title" | "source" | "type" | "url" | "market" | "sector" | "summary_raw">;
  analysis: ArbitrageAnalysis;
}

export type ProviderName = "gemini" | "anthropic";

export interface AnalyzeOptions {
  provider?: AnalystProvider; // doğrudan inject (test)
  providerName?: ProviderName; // varsayılan env ANALYSIS_PROVIDER ?? "gemini"
  model?: string;
  apiKey?: string;
  thesis?: ThesisConfig;
  fewShot?: FewShotExample[];
  knowledge?: KnowledgeLayer;
  maxRetries?: number; // şema/guard ihlalinde yeniden deneme
}

function pickProvider(opts: AnalyzeOptions): AnalystProvider {
  if (opts.provider) return opts.provider;
  const name = opts.providerName ?? (process.env["ANALYSIS_PROVIDER"] as ProviderName) ?? "gemini";
  const cfg = { apiKey: opts.apiKey, model: opts.model };
  return name === "anthropic" ? new AnthropicProvider(cfg) : new GeminiProvider(cfg);
}

function renderFewShot(examples: FewShotExample[]): string {
  if (examples.length === 0) return "";
  const blocks = examples.map((ex, i) => {
    const s = ex.signal;
    return `### Örnek ${i + 1}
Sinyal: ${s.title} — ${s.source} (${s.type}); pazar=${s.market ?? "?"}, sektör=${s.sector ?? "?"}
Özet: ${s.summary_raw || "(yok)"}
Beklenen analiz (JSON):
${JSON.stringify(ex.analysis)}`;
  });
  return `\n\n## Altın-standart örnekler (yargını bunlara göre hizala)\n${blocks.join("\n\n")}`;
}

/**
 * Bir sinyali arbitraj merceğiyle analiz et. Sağlayıcı-bağımsız (MVP: Gemini, sonra Claude).
 * Yapısal JSON → zod + mantık guard'ları; ihlalde prompt'a geri bildirim ekleyip yeniden dener.
 */
export async function analyzeSignal(
  signal: Signal,
  opts: AnalyzeOptions = {},
): Promise<ArbitrageAnalysis> {
  const provider = pickProvider(opts);
  const thesis = opts.thesis ?? defaultThesis;
  const knowledge = opts.knowledge ?? emptyKnowledgeLayer;
  const maxRetries = opts.maxRetries ?? 3;

  const ctx = await knowledge.getContext(signal);
  const ctxText =
    ctx.notes.length > 0 ? `\n\nİlgili geçmiş bağlam:\n- ${ctx.notes.join("\n- ")}` : "";

  const system = buildArbitrageSystemPrompt(thesis) + renderFewShot(opts.fewShot ?? []);
  const jsonSchema = zodToJsonSchema(ArbitrageAnalysisSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete jsonSchema["$schema"];

  // Zenginleştirme varsa prompt'a olgu bloğu olarak gir (yoksa bugünkü davranış).
  const enrParsed = StoredEnrichmentSchema.safeParse(signal.enrichment);
  const baseUser =
    buildArbitrageUserPrompt(signal, enrParsed.success ? enrParsed.data : null) + ctxText;
  let feedback = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const user = feedback ? `${baseUser}\n\n${feedback}` : baseUser;
    const raw = await provider.generate({ system, user, jsonSchema });

    const parsed = ArbitrageAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      feedback = `Önceki çıktı şema hatası verdi: ${parsed.error.message}. Şemaya uygun düzelt.`;
      continue;
    }

    const violations = checkArbitrageGuards(parsed.data, {
      ...(enrParsed.success ? { signalKind: enrParsed.data.signal_kind } : {}),
    });
    if (violations.length > 0) {
      feedback = `Önceki çıktıda mantık ihlali: ${violations.join("; ")}. Düzelt.`;
      continue;
    }

    return parsed.data;
  }

  throw new Error(`analist (${provider.name}) ${maxRetries + 1} denemede geçerli analiz üretemedi (${signal.url})`);
}
