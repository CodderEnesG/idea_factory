import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { thesis as defaultThesis, type ThesisConfig } from "./thesis.config.js";
import { buildSignalBrief, lenses } from "./lenses.config.js";
import type { Signal } from "./signal.js";
import type { StoredEnrichment } from "./enrichment.js";
import type { AnalystProvider } from "./providers/types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { AnthropicProvider } from "./providers/anthropic.js";

/**
 * Ön-eleme (triage): sinyal ARBİTRAJ/BEYAZ-ALAN gibi pahalı, çok-mercekli tam analize
 * değer mi — kaba, ucuz, tek çağrılık bir tahmin. Kesin karar vermez, önceliklendirir.
 * PLAN.md §Birim Ekonomisi: "analiz öncesi hacmi düşür" — mercek sayısı arttıkça tam
 * analizin maliyeti katlanıyor, triage bu hacmi akıllı sıralar (bkz. apps/worker/src/triage.ts).
 */
export const TriageResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().min(1),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;

export function buildTriageSystemPrompt(t: ThesisConfig): string {
  const lensList = lenses.map((l) => `- ${l.name}`).join("\n");
  return `Sen ucuz-hızlı bir ön-eleme asistanısın. Görevin bir sinyalin TAM mercek analizine
(derin, çok-adımlı, pahalı) değip değmeyeceğini kabaca puanlamak — kesin karar vermezsin,
yalnız önceliklendirirsin.

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Hedef pazarlar: ${t.target_markets.join(", ")}
- Sektörler: ${t.sectors.join(", ")}
- Anti-pattern'ler: ${t.anti_patterns.join("; ")}

## Aktif mercekler (herhangi birinde güçlü aday olması yeterli)
${lensList}

## Puanlama (0-100)
Bu sinyal aktif mercek(ler)den EN AZ birinde güçlü bir aday olabilir mi? Emin olamadığında
YÜKSEK ver — yanlış negatif (fırsatı tamamen kaybetmek) yanlış pozitiften (bir fazla derin
analiz çağrası) çok daha pahalıdır, asimetrik hata ucuz tarafta olmalı. Açık anti-pattern'e
giren veya arkasında somut teşebbüs olmayan (essay/research/görüş yazısı) sinyallere düşük
puan ver. reason: tek cümle, kısa gerekçe.

Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
}

export function buildTriageUserPrompt(s: Signal, enrichment?: StoredEnrichment | null): string {
  return `${buildSignalBrief(s, enrichment)}

Bu sinyali ön-ele ve JSON döndür.`;
}

export interface TriageOptions {
  provider?: AnalystProvider; // doğrudan inject (test)
  providerName?: "gemini" | "anthropic";
  model?: string;
  apiKey?: string;
  thesis?: ThesisConfig;
  maxRetries?: number;
}

function pickProvider(opts: TriageOptions): AnalystProvider {
  if (opts.provider) return opts.provider;
  const name = opts.providerName ?? (process.env["ANALYSIS_PROVIDER"] as "gemini" | "anthropic") ?? "gemini";
  const cfg = { apiKey: opts.apiKey, model: opts.model };
  return name === "anthropic" ? new AnthropicProvider(cfg) : new GeminiProvider(cfg);
}

/**
 * Sağlayıcı-bağımsız, şema-hatasında kısa retry (guard/few-shot yok — analyst.ts'ten
 * kasıtlı daha hafif, bu adımın tüm amacı ucuz olmak).
 */
export async function triageSignal(
  signal: Signal,
  enrichment: StoredEnrichment | null,
  opts: TriageOptions = {},
): Promise<TriageResult> {
  const provider = pickProvider(opts);
  const thesis = opts.thesis ?? defaultThesis;
  const maxRetries = opts.maxRetries ?? 1;

  const system = buildTriageSystemPrompt(thesis);
  const jsonSchema = zodToJsonSchema(TriageResultSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete jsonSchema["$schema"];

  const baseUser = buildTriageUserPrompt(signal, enrichment);
  let feedback = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const user = feedback ? `${baseUser}\n\n${feedback}` : baseUser;
    const raw = await provider.generate({ system, user, jsonSchema });

    const parsed = TriageResultSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    feedback = `Önceki çıktı şema hatası verdi: ${parsed.error.message}. Şemaya uygun düzelt.`;
  }

  throw new Error(
    `triage (${provider.name}) ${maxRetries + 1} denemede geçerli çıktı üretemedi (${signal.url})`,
  );
}
