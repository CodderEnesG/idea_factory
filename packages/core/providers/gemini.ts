import { GoogleGenAI } from "@google/genai";
import type { AnalystProvider, GenerateArgs } from "./types.js";
import { isTimeoutError, llmTimeoutMs, timeoutError } from "../deadline.js";

/**
 * Vertex/AI-Studio seçimi + auth kurulumu — GeminiProvider VE grounding.ts (PLAN.md §11
 * madde 2) aynı mantığı paylaşsın diye çıkarıldı (iki ayrı yerde env okumak = tutarsızlık
 * riski). Davranış değişmedi, saf refactor.
 */
export function createGeminiClient(opts?: { apiKey?: string; vertex?: boolean }): GoogleGenAI {
  const useVertex =
    opts?.vertex ??
    (process.env["GEMINI_USE_VERTEX"] === "true" ||
      process.env["GOOGLE_GENAI_USE_VERTEXAI"] === "true");
  if (useVertex) {
    // Vertex AI (GCP) — ADC auth (gcloud application-default). Kullanım GCP
    // faturasına gider → $300 trial kredi kapsar. project/location env'den.
    return new GoogleGenAI({
      vertexai: true,
      project: process.env["GOOGLE_CLOUD_PROJECT"],
      location: process.env["GOOGLE_CLOUD_LOCATION"] ?? "us-central1",
    });
  }
  // Developer API (AI Studio) — AIza key.
  return new GoogleGenAI({ apiKey: opts?.apiKey ?? process.env["GEMINI_API_KEY"] });
}

/**
 * MVP analist sağlayıcısı = Gemini (ucuz). Structured output: responseMimeType +
 * responseJsonSchema. v1'de grounding (google search) bu çağrıda kapalı — responseSchema
 * modu ile googleSearch tool'u aynı istekte birleşemiyor (Gemini API kısıtı); grounding
 * artık ayrı, serbest bir ön-çağrı olarak `grounding.ts`'te yaşıyor (bkz. PLAN.md §11 madde 2).
 * Model config: GEMINI_MODEL (varsayılan gemini-3.5-flash; erişim yoksa gemini-2.5-flash'a düşür).
 */
export class GeminiProvider implements AnalystProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string; vertex?: boolean }) {
    this.ai = createGeminiClient(opts);
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
    // Zaman aşımı (FAZ6_PLAN.md §Faz 1.1): timeout'suz bir çağrı, asılan Vertex bağlantısında
    // tick'i sonsuza kadar bekletir — cron.ts'in `running` guard'ı da kalıcı kilitlenir ve
    // pipeline sessizce ölür. grounding.ts:44 aynı deseni bu SDK sürümünde zaten kullanıyor.
    const ms = llmTimeoutMs();
    config["abortSignal"] = AbortSignal.timeout(ms);
    let res;
    try {
      res = await this.ai.models.generateContent({
        model: this.model,
        contents: user,
        config,
      });
    } catch (e) {
      // Çıplak AbortError log'da kota hatasından ayrılamıyordu — ayırt edilebilir mesaj.
      if (isTimeoutError(e)) throw timeoutError(this.name, this.model, ms);
      throw e;
    }
    const text = res.text;
    if (!text) throw new Error("gemini: boş yanıt");
    return JSON.parse(text);
  }
}
