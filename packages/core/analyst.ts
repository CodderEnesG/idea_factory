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
import { groundSignal, shouldGround, type Grounder } from "./grounding.js";
import { Deadline, analyzeDeadlineMs } from "./deadline.js";

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
  grounder?: Grounder; // test injection; varsayılan groundSignal
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

  // Zenginleştirme varsa prompt'a olgu bloğu olarak gir (yoksa bugünkü davranış).
  // NOT: grounding çağrısından ÖNCE parse ediliyor — sorgular marka adı yerine kategori
  // ifadesinden kuruluyor ve `project_summary` oradan geliyor (FAZ6_PLAN.md §Faz 4.2).
  const enrParsed = StoredEnrichmentSchema.safeParse(signal.enrichment);
  const enrichment = enrParsed.success ? enrParsed.data : null;

  // Grounding — yalnız `lens.grounding` + GROUNDING_ENABLED. TEK SEFER, retry döngüsünün
  // DIŞINDA: retry'lar şema/guard ihlali içindir, arama bulgusu bunlar arasında değişmez.
  // Artık sorgu başına ayrı çağrı yapıldığı için bu, 1× değil 3× maliyet hatası olurdu.
  // Kapı BURADA da uygulanıyor (groundSignal kendi içinde de kontrol ediyor): enjekte edilen
  // bir grounder da maliyet kuralına uymalı, yoksa "kapalı mercekte arama yapılmaz" garantisi
  // yalnız varsayılan implementasyona bağlı kalırdı.
  const grounder = opts.grounder ?? groundSignal;
  const groundingText = shouldGround(lens) ? await grounder(signal, lens, enrichment) : null;
  const groundingBlock = groundingText
    ? `\n\nGrounding bulgusu (canlı arama sonucu, olgu olarak kullan ama sorgula):\n${groundingText}`
    : "";

  const system = lens.buildSystemPrompt(thesis) + renderFewShot(opts.fewShot ?? []);
  const jsonSchema = zodToJsonSchema(lens.schema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete jsonSchema["$schema"];

  const baseUser = lens.buildUserPrompt(signal, enrichment) + ctxText + groundingBlock;
  let feedback = "";

  // Operasyon bütçesi: 4 denemenin toplamı da sınırlı olmalı (FAZ6_PLAN.md §Faz 1.1).
  const deadline = new Deadline(analyzeDeadlineMs(), `analiz (${lens.id})`);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    deadline.check(feedback || `deneme ${attempt + 1}`);
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
      ...(enrichment?.signal_kind ? { signalKind: enrichment.signal_kind } : {}),
      lensId: lens.id,
      traction: enrichment?.traction,
      markets: enrichment?.markets,
      capitalIntensity: enrichment?.capital_intensity,
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
