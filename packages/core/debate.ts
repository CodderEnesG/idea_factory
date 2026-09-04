import { z } from "zod";
import { buildSignalBrief, EvidenceItem, RecommendedAction } from "./lenses.config.js";
import { thesis as defaultThesis, type ThesisConfig } from "./thesis.config.js";
import { StoredEnrichmentSchema } from "./enrichment.js";
import { Deadline, debateDeadlineMs } from "./deadline.js";
import type { Signal } from "./signal.js";
import type { AnalystProvider } from "./providers/types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * AI Yorumcusu — çok-ajanlı tartışma odası (PLAN.md §10-E). Admin bir kartta tetikler
 * (otomatik/toplu DEĞİL); sabit roster + sabit tur sayısı = öngörülebilir maliyet.
 * `analyses`'a değil ayrı `debates` tablosuna yazılır — kompozit skora karışmaz.
 */

export interface DebateRole {
  name: string;
  persona: string;
}

/** Kullanıcı onaylı varsayılan roster (PLAN.md §10-E). */
export const DEBATE_ROSTER: DebateRole[] = [
  {
    name: "İyimser Kurucu",
    persona:
      "Bu fırsatı kurmayı düşünen iyimser bir kurucusun. Görevin: bu sinyalin bu teze göre " +
      "neden kovalanmaya değer olduğunu en güçlü haliyle savunmak — ama uydurma, yalnız " +
      "sinyaldeki olgudan çıkar sonuç.",
  },
  {
    name: "Şüpheci Yatırımcı",
    persona:
      "Bu fırsata yatırım yapması istenen şüpheci bir yatırımcısın. Görevin: neden bu riskli/" +
      "kovalanmamalı olduğunu en güçlü haliyle savunmak — kırılma noktalarını, anti-pattern'leri, " +
      "kanıt zayıflıklarını öne çıkar.",
  },
  {
    name: "Pazar-Rekabet Analisti",
    persona:
      "Tarafsız bir pazar-rekabet analistisin. Görevin: TR/MENA'daki rekabet ortamını ve pazar " +
      "dinamiklerini nesnel değerlendirmek — ne kurucu tarafını ne yatırımcı tarafını tutarsın.",
  },
];

export const DebateTurnSchema = z.object({
  message: z.string().min(1),
  evidence: z.array(EvidenceItem), // atıfsız olgu reddedilir (guard)
  rebuts: z.array(z.string()).default([]), // itiraz turunda adıyla atıf yapılan konuşmacılar
  position: RecommendedAction.optional(), // itiraz turunda zorunlu (guard)
});
export type DebateTurnOutput = z.infer<typeof DebateTurnSchema>;

export const ModeratorTurnSchema = z.object({
  synthesis: z.string().min(1),
  final_verdict: RecommendedAction,
  final_commentary: z.string().min(1),
});
export type ModeratorTurnOutput = z.infer<typeof ModeratorTurnSchema>;

export interface DebateTurn {
  speaker: string;
  message: string;
  evidence: { fact: string; source: string }[];
  rebuts: string[];
  position?: "pursue" | "watch" | "kill";
}

export interface DebateResult {
  transcript: DebateTurn[];
  final_verdict: "pursue" | "watch" | "kill";
  final_commentary: string;
}

export interface DebateOptions {
  provider?: AnalystProvider;
  providerName?: "gemini" | "anthropic";
  model?: string;
  apiKey?: string;
  thesis?: ThesisConfig;
  /** Her tur bitince çağrılır — UI'da ilerleme göstergesi için (bkz. DebateRoom.tsx). */
  onTurn?: (info: { index: number; total: number; speaker: string }) => void;
}

/** Sabit tur sayısı: 3 rol × (açılış + itiraz) + Moderatör × 1 sentez. */
export const DEBATE_TOTAL_TURNS = DEBATE_ROSTER.length * 2 + 1;

function pickProvider(opts: DebateOptions): AnalystProvider {
  if (opts.provider) return opts.provider;
  const name = opts.providerName ?? (process.env["ANALYSIS_PROVIDER"] as "gemini" | "anthropic") ?? "gemini";
  const cfg = { apiKey: opts.apiKey, model: opts.model };
  return name === "anthropic" ? new AnthropicProvider(cfg) : new GeminiProvider(cfg);
}

function buildRoleSystemPrompt(role: DebateRole, t: ThesisConfig): string {
  return `Sen "${role.name}" rolünü oynayan bir tartışma katılımcısısın. ${role.persona}

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Hedef pazarlar: ${t.target_markets.join(", ")}
- Sektörler: ${t.sectors.join(", ")}
- Yetkinlikler: ${t.capabilities.join(", ")}
- Risk iştahı: ${t.risk_appetite}
- Anti-pattern'ler: ${t.anti_patterns.join("; ")}

## Kurallar (kritik, ihlal edilemez)
- Rolünün dışına çıkamazsın — her zaman "${role.name}" bakış açısından konuş.
- Söylediğin her olgu KAYNAK atfıyla gelir (evidence[].source); atıfsız olgu yazma.
- İtiraz (2. tur) turunda: önceki konuşmacılara adıyla atıfla itiraz et/katıl (rebuts[]'a
  isimlerini yaz) VE kendi nihai kovala/izle/ele pozisyonunu (position) netleştir.
- Açılış turunda position boş bırakılabilir.
- Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
}

const MODERATOR_SYSTEM = (t: ThesisConfig) => `Sen tartışmayı yöneten tarafsız bir Moderatörsün.
İyimser Kurucu, Şüpheci Yatırımcı ve Pazar-Rekabet Analisti'nin açılış+itiraz turlarını dinledin.

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Risk iştahı: ${t.risk_appetite}
- Anti-pattern'ler: ${t.anti_patterns.join("; ")}

Görevin: tartışmayı sentezlemek, en güçlü argümanları tartıp bu teze göre nihai bir
kovala/izle/ele kararı vermek ve nedenini kısaca özetlemek. Çıktıyı YALNIZ verilen JSON
şemasına uygun üret.`;

function renderTranscript(turns: DebateTurn[]): string {
  return turns
    .map((t) => {
      const ev = t.evidence.map((e) => `${e.fact} (${e.source})`).join("; ");
      const pos = t.position ? ` [pozisyon: ${t.position}]` : "";
      return `${t.speaker}: ${t.message}${pos}\n  kanıt: ${ev || "yok"}`;
    })
    .join("\n\n");
}

/** Zod-sonrası mantık guard'ı: her turda kanıt atfı zorunlu; itiraz turunda adıyla atıf + pozisyon zorunlu. */
function checkTurnGuards(out: DebateTurnOutput, isRebuttal: boolean): string[] {
  const v: string[] = [];
  if (out.evidence.length === 0) v.push("kanıt atfı zorunlu: evidence[] boş");
  if (out.evidence.some((e) => e.source.trim() === "")) v.push("atıfsız olgu: evidence[].source boş");
  if (isRebuttal) {
    if (out.rebuts.length === 0) v.push("itiraz turunda rebuts[] boş olamaz (adıyla atıf zorunlu)");
    if (!out.position) v.push("itiraz turunda position zorunlu (nihai pozisyon netleşmeli)");
  }
  return v;
}

async function generateTurn<T>(
  provider: AnalystProvider,
  system: string,
  user: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  maxRetries = 1,
): Promise<T> {
  const jsonSchema = zodToJsonSchema(schema, { target: "jsonSchema7" }) as Record<string, unknown>;
  delete jsonSchema["$schema"];
  let feedback = "";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const raw = await provider.generate({
      system,
      user: feedback ? `${user}\n\n${feedback}` : user,
      jsonSchema,
    });
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    feedback = `Önceki çıktı şema hatası verdi: ${parsed.error.message}. Şemaya uygun düzelt.`;
  }
  throw new Error(`AI Yorumcusu (${provider.name}) ${maxRetries + 1} denemede geçerli tur üretemedi`);
}

/** Sabit 7 çağrı: 3 rol × (açılış + itiraz) + Moderatör × 1 sentez. */
export async function runDebate(
  signal: Signal,
  opts: DebateOptions = {},
): Promise<DebateResult> {
  const provider = pickProvider(opts);
  const thesis = opts.thesis ?? defaultThesis;
  const enrParsed = StoredEnrichmentSchema.safeParse(signal.enrichment);
  const brief = buildSignalBrief(signal, enrParsed.success ? enrParsed.data : null);
  const transcript: DebateTurn[] = [];
  // Operasyon bütçesi (FAZ6_PLAN.md §Faz 1.1): 7 tur × 2 deneme, çağrı başına timeout olsa
  // bile toplamda ~21dk edebilir. Tartışma artık Yorumcu kapısıyla tick'in kritik hattında —
  // bütçe aşılırsa FIRLAT, kısmi transkript `debates` tablosuna ASLA yazılmasın.
  const deadline = new Deadline(debateDeadlineMs(), "tartışma");

  async function generateRoleTurn(system: string, user: string, isRebuttal: boolean): Promise<DebateTurnOutput> {
    let out = await generateTurn<DebateTurnOutput>(provider, system, user, DebateTurnSchema);
    const violations = checkTurnGuards(out, isRebuttal);
    if (violations.length > 0) {
      const feedback = `Önceki çıktıda mantık ihlali: ${violations.join("; ")}. Düzelt.`;
      out = await generateTurn<DebateTurnOutput>(provider, system, `${user}\n\n${feedback}`, DebateTurnSchema);
    }
    return out;
  }

  function reportTurn(speaker: string) {
    opts.onTurn?.({ index: transcript.length, total: DEBATE_TOTAL_TURNS, speaker });
  }

  // açılış turu — sırayla, önceki rolün turunu görmez (bağımsız ilk izlenim).
  for (const role of DEBATE_ROSTER) {
    deadline.check(`açılış turu: ${role.name}`);
    const system = buildRoleSystemPrompt(role, thesis);
    const user = `${brief}\n\nAçılış turun. Kendi rolünden bu sinyali değerlendir.`;
    const out = await generateRoleTurn(system, user, false);
    transcript.push({ speaker: role.name, ...out, rebuts: out.rebuts ?? [] });
    reportTurn(role.name);
  }

  // itiraz turu — o ana kadarki TAM transkripti görür, adıyla itiraz edebilir, pozisyon zorunlu.
  for (const role of DEBATE_ROSTER) {
    deadline.check(`itiraz turu: ${role.name}`);
    const system = buildRoleSystemPrompt(role, thesis);
    const user = `${brief}\n\n## Şimdiye kadarki tartışma:\n${renderTranscript(transcript)}\n\nİtiraz turun. Diğer konuşmacılara adıyla atıfla itiraz et/katıl, ve kendi nihai kovala/izle/ele pozisyonunu netleştir.`;
    const out = await generateRoleTurn(system, user, true);
    transcript.push({ speaker: role.name, ...out, rebuts: out.rebuts ?? [] });
    reportTurn(role.name);
  }

  // sentez turu — Moderatör, tam transkripti görür, nihai kararı verir.
  deadline.check("sentez turu");
  const modSystem = MODERATOR_SYSTEM(thesis);
  const modUser = `${brief}\n\n## Tam tartışma:\n${renderTranscript(transcript)}\n\nSentez turun. Tartışmayı özetle, nihai kovala/izle/ele kararını ver ve nedenini kısaca açıkla.`;
  const mod = await generateTurn<ModeratorTurnOutput>(provider, modSystem, modUser, ModeratorTurnSchema);
  transcript.push({
    speaker: "Moderatör",
    message: mod.synthesis,
    evidence: [],
    rebuts: [],
    position: mod.final_verdict,
  });
  reportTurn("Moderatör");

  return { transcript, final_verdict: mod.final_verdict, final_commentary: mod.final_commentary };
}
