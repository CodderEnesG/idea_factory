import Anthropic from "@anthropic-ai/sdk";
import type { AnalystProvider, GenerateArgs } from "./types.js";

/**
 * Claude sağlayıcısı (Claude-sonrası / faz 2 için hazır). Structured output: forced
 * submit_analysis tool. Grounding v1'de yok (Gemini ile parite).
 */
export class AnthropicProvider implements AnalystProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(opts?: { client?: Anthropic; apiKey?: string; model?: string }) {
    this.client =
      opts?.client ?? new Anthropic({ apiKey: opts?.apiKey ?? process.env["ANTHROPIC_API_KEY"] });
    this.model = opts?.model ?? process.env["ANALYSIS_MODEL"] ?? "claude-opus-4-8";
  }

  async generate({ system, user, jsonSchema }: GenerateArgs): Promise<unknown> {
    const resp = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system,
      tools: [
        {
          name: "submit_analysis",
          description: "Arbitraj analizini şemaya uygun JSON olarak gönder.",
          input_schema: jsonSchema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "submit_analysis" },
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_analysis",
    );
    if (!block) throw new Error("anthropic: submit_analysis çağrısı yok");
    return block.input;
  }
}
