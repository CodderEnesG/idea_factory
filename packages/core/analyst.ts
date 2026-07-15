import Anthropic from "@anthropic-ai/sdk";
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
import type { Signal } from "./signal.js";

/** Golden few-shot çapası: bir sinyal + onun onaylı analizi. */
export interface FewShotExample {
  signal: Pick<Signal, "title" | "source" | "type" | "url" | "market" | "sector" | "summary_raw">;
  analysis: ArbitrageAnalysis;
}

export interface AnalyzeOptions {
  client?: Anthropic; // test/inject için
  model?: string; // analysis_model (varsayılan claude-opus-4-8)
  apiKey?: string;
  thesis?: ThesisConfig;
  fewShot?: FewShotExample[];
  knowledge?: KnowledgeLayer;
  enableWebSearch?: boolean; // v1: kanıt için canlı web (varsayılan açık)
  maxSteps?: number; // tool-nudge + şema/guard retry bütçesi
}

const SUBMIT_TOOL = "submit_analysis";

function submitTool(): Anthropic.Tool {
  const schema = zodToJsonSchema(ArbitrageAnalysisSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete schema["$schema"];
  return {
    name: SUBMIT_TOOL,
    description: "Arbitraj analizini bu şemaya uygun yapılandırılmış JSON olarak gönder.",
    input_schema: schema as Anthropic.Tool.InputSchema,
  };
}

// web_search server tool (Anthropic tarafında yürütülür). SDK tipi kesin olmayabilir → cast.
const webSearchTool = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 5,
} as unknown as Anthropic.Tool;

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
 * Bir sinyali arbitraj merceğiyle analiz et. Yapısal çıktı (submit_analysis tool) +
 * zod + mantık guard'ları; ihlalde model'e geri bildirim verip yeniden dener.
 */
export async function analyzeSignal(
  signal: Signal,
  opts: AnalyzeOptions = {},
): Promise<ArbitrageAnalysis> {
  const client = opts.client ?? new Anthropic({ apiKey: opts.apiKey ?? process.env["ANTHROPIC_API_KEY"] });
  const model = opts.model ?? process.env["ANALYSIS_MODEL"] ?? "claude-opus-4-8";
  const thesis = opts.thesis ?? defaultThesis;
  const knowledge = opts.knowledge ?? emptyKnowledgeLayer;
  const enableWebSearch = opts.enableWebSearch ?? true;
  const maxSteps = opts.maxSteps ?? 6;

  const ctx = await knowledge.getContext(signal);
  const ctxText =
    ctx.notes.length > 0 ? `\n\nİlgili geçmiş bağlam:\n- ${ctx.notes.join("\n- ")}` : "";

  const system = buildArbitrageSystemPrompt(thesis) + renderFewShot(opts.fewShot ?? []);
  const tools: Anthropic.Tool[] = [submitTool(), ...(enableWebSearch ? [webSearchTool] : [])];

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildArbitrageUserPrompt(signal) + ctxText },
  ];

  for (let step = 0; step < maxSteps; step++) {
    const resp = await client.messages.create({
      model,
      max_tokens: 2048,
      system,
      tools,
      messages,
    });

    // Server tool (web_search) çalışıyor → turn'ü sürdür. (SDK tipi geride; API destekler.)
    if ((resp.stop_reason as string) === "pause_turn") {
      messages.push({ role: "assistant", content: resp.content });
      continue;
    }

    const submit = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === SUBMIT_TOOL,
    );

    if (!submit) {
      messages.push({ role: "assistant", content: resp.content });
      messages.push({
        role: "user",
        content: "Analizi tamamladıysan submit_analysis aracını çağır.",
      });
      continue;
    }

    const parsed = ArbitrageAnalysisSchema.safeParse(submit.input);
    if (!parsed.success) {
      messages.push({ role: "assistant", content: resp.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: submit.id,
            is_error: true,
            content: `Şema hatası: ${parsed.error.message}. Düzelt ve tekrar submit_analysis çağır.`,
          },
        ],
      });
      continue;
    }

    const violations = checkArbitrageGuards(parsed.data);
    if (violations.length > 0) {
      messages.push({ role: "assistant", content: resp.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: submit.id,
            is_error: true,
            content: `Mantık ihlali: ${violations.join("; ")}. Düzelt ve tekrar submit_analysis çağır.`,
          },
        ],
      });
      continue;
    }

    return parsed.data;
  }

  throw new Error(`analist ${maxSteps} adımda geçerli analiz üretemedi (${signal.url})`);
}
