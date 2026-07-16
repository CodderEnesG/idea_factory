import { GoogleGenAI } from "@google/genai";
import type { AnalystProvider, GenerateArgs } from "./types.js";

/**
 * MVP analist sağlayıcısı = Gemini (ucuz). Structured output: responseMimeType +
 * responseJsonSchema. v1'de grounding (google search) kapalı — kanıt zayıfsa analist
 * "doğrulanmalı" der (felsefe zaten bu). Model config: GEMINI_MODEL (varsayılan gemini-3.5-flash;
 * erişim yoksa gemini-2.5-flash'a düşür).
 */
export class GeminiProvider implements AnalystProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    this.ai = new GoogleGenAI({ apiKey: opts?.apiKey ?? process.env["GEMINI_API_KEY"] });
    this.model = opts?.model ?? process.env["GEMINI_MODEL"] ?? "gemini-3.5-flash";
  }

  async generate({ system, user, jsonSchema }: GenerateArgs): Promise<unknown> {
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        // Newer @google/genai: tam JSON Schema geçilebilir.
        responseJsonSchema: jsonSchema,
        temperature: 0.4,
        // gemini-3.x thinking modeli — düşük seviyeyle bağla (MVP ucuz+hızlı;
        // uncapped thinking heavy schema'da latency'yi patlatıyor).
        thinkingConfig: { thinkingLevel: "low" },
      } as Record<string, unknown>,
    });
    const text = res.text;
    if (!text) throw new Error("gemini: boş yanıt");
    return JSON.parse(text);
  }
}
