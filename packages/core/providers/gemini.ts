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

  constructor(opts?: { apiKey?: string; model?: string; vertex?: boolean }) {
    const useVertex =
      opts?.vertex ??
      (process.env["GEMINI_USE_VERTEX"] === "true" ||
        process.env["GOOGLE_GENAI_USE_VERTEXAI"] === "true");
    if (useVertex) {
      // Vertex AI (GCP) — ADC auth (gcloud application-default). Kullanım GCP
      // faturasına gider → $300 trial kredi kapsar. project/location env'den.
      this.ai = new GoogleGenAI({
        vertexai: true,
        project: process.env["GOOGLE_CLOUD_PROJECT"],
        location: process.env["GOOGLE_CLOUD_LOCATION"] ?? "us-central1",
      });
    } else {
      // Developer API (AI Studio) — AIza key.
      this.ai = new GoogleGenAI({ apiKey: opts?.apiKey ?? process.env["GEMINI_API_KEY"] });
    }
    this.model = opts?.model ?? process.env["GEMINI_MODEL"] ?? "gemini-3.5-flash";
  }

  async generate({ system, user, jsonSchema }: GenerateArgs): Promise<unknown> {
    const config: Record<string, unknown> = {
      systemInstruction: system,
      responseMimeType: "application/json",
      // Newer @google/genai: tam JSON Schema geçilebilir.
      responseJsonSchema: jsonSchema,
      temperature: 0.4,
    };
    // thinkingLevel yalnız gemini-3.x'te var; 2.5 reddediyor (INVALID_ARGUMENT).
    // 3.x'te düşük seviyeyle bağla (heavy schema'da thinking runaway latency'yi patlatır).
    if (/gemini-3/.test(this.model)) {
      config["thinkingConfig"] = { thinkingLevel: "low" };
    }
    const res = await this.ai.models.generateContent({
      model: this.model,
      contents: user,
      config,
    });
    const text = res.text;
    if (!text) throw new Error("gemini: boş yanıt");
    return JSON.parse(text);
  }
}
