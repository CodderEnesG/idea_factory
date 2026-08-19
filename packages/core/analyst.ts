import { zodToJsonSchema } from "zod-to-json-schema";
import type { BaseAnalysis, Lens } from "./lenses.config.js";
import { thesis as defaultThesis, type ThesisConfig } from "./thesis.config.js";
import { checkAnalysisGuards } from "./guards.js";
import { emptyKnowledgeLayer, type KnowledgeLayer } from "./knowledge.js";
import { StoredEnrichmentSchema } from "./enrichment.js";
import type { Signal } from "./signal.js";
import type { AnalystProvider } from "./providers/types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { groundSignal, lensNeedsGrounding } from "./grounding.js";

/** Golden few-shot çapası: bir sinyal + onun onaylı analizi. */
export interface FewShotExample<TAnalysis extends BaseAnalysis = BaseAnalysis> {
  signal: Pick<Signal, "title" | "source" | "type" | "url" | "market" | "sector" | "summary_raw">;
  analysis: TAnalysis;
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
  grounder?: (signal: Signal) => Promise<string | null>; // test injection; varsayılan groundSignal
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
 * Bir sinyali verilen mercekle analiz et. Sağlayıcı-bağımsız (MVP: Gemini, sonra Claude).
 * Yapısal JSON → zod + mantık guard'ları; ihlalde prompt'a geri bildirim ekleyip yeniden dener.
 */
export async function analyzeSignal<TAnalysis extends BaseAnalysis>(
  signal: Signal,
  lens: Lens<TAnalysis>,
  opts: AnalyzeOptions = {},
): Promise<TAnalysis> {
  const provider = pickProvider(opts);
  const thesis = opts.thesis ?? defaultThesis;
  const knowledge = opts.knowledge ?? emptyKnowledgeLayer;
  const maxRetries = opts.maxRetries ?? 3;

  const ctx = await knowledge.getContext(signal);
  const ctxText =
    ctx.notes.length > 0 ? `\n\nİlgili geçmiş bağlam:\n- ${ctx.notes.join("\n- ")}` : "";

  // Grounding (PLAN.md §11 madde 2) — yalnız GROUNDING_ENABLED + rekabet ortamı sorusu
  // döndüğü mercekler (arbitraj/beyaz-alan) için, tek sefer (retry döngüsü boyunca aynı
  // bulgu tekrar kullanılır — grounding sonucu şema/guard ihlalinden etkilenmez).
  const grounder = opts.grounder ?? groundSignal;
  const groundingText = lensNeedsGrounding(lens.id) ? await grounder(signal) : null;
  const groundingBlock = groundingText
    ? `\n\nGrounding bulgusu (canlı arama sonucu, olgu olarak kullan ama sorgula):\n${groundingText}`
    : "";

  const system = lens.buildSystemPrompt(thesis) + renderFewShot(opts.fewShot ?? []);
  const jsonSchema = zodToJsonSchema(lens.schema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete jsonSchema["$schema"];

  // Zenginleştirme varsa prompt'a olgu bloğu olarak gir (yoksa bugünkü davranış).
  const enrParsed = StoredEnrichmentSchema.safeParse(signal.enrichment);
  const baseUser =
    lens.buildUserPrompt(signal, enrParsed.success ? enrParsed.data : null) + ctxText + groundingBlock;
  let feedback = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const user = feedback ? `${baseUser}\n\n${feedback}` : baseUser;
    const raw = await provider.generate({ system, user, jsonSchema });

    // `lens` alanı çağıranın ZATEN bildiği metadata — modele sordurmak saf başarısızlık yüzeyi.
    // Gemini "white_space" yerine "white-space" üretip zod literal'ını düşürüyordu; sinyal 4
    // denemede de yazılamıyordu (2026-08-10 backfill teşhisi). Arbitraj tek kelime olduğu için
    // bu tuzağa hiç düşmemişti — alt tire/tire içeren her mercek (custom admin-mercekleri dahil)
    // düşüyordu. Şemaya vermeden önce doğru id'yi biz yazıyoruz; model kararı değil, bizim bilgimiz.
    const normalized =
      raw && typeof raw === "object" && !Array.isArray(raw) ? { ...raw, lens: lens.id } : raw;
    const parsed = lens.schema.safeParse(normalized);
    if (!parsed.success) {
      feedback = `Önceki çıktı şema hatası verdi: ${parsed.error.message}. Şemaya uygun düzelt.`;
      continue;
    }

    const violations = checkAnalysisGuards(parsed.data, {
      // signal_kind null = legacy satır — ön kapı guard'ına sınıf bildirme.
      ...(enrParsed.success && enrParsed.data.signal_kind
        ? { signalKind: enrParsed.data.signal_kind }
        : {}),
      lensId: lens.id,
      traction: enrParsed.success ? enrParsed.data.traction : undefined,
      markets: enrParsed.success ? enrParsed.data.markets : undefined,
    });
    if (violations.length > 0) {
      feedback = `Önceki çıktıda mantık ihlali: ${violations.join("; ")}. Düzelt.`;
      continue;
    }

    return parsed.data;
  }

  // Son geri bildirimi hataya iliştir: aksi halde "4 denemede olmadı" çıplak kalıyor ve
  // ihlalin ŞEMA mı GUARD mı olduğu (hangi kural) log'dan hiç görünmüyordu — kalibrasyon
  // gerektiren bir mercekte bu, teşhisi imkânsız kılıyor (bkz. beyaz-alan backfill'i 2026-08-10).
  throw new Error(
    `analist (${provider.name}) ${maxRetries + 1} denemede geçerli analiz üretemedi ` +
      `(${signal.url})${feedback ? ` — son ihlal: ${feedback}` : ""}`,
  );
}
