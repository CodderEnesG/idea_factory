import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { thesis as defaultThesis, type ThesisConfig } from "./thesis.config.js";
import type { Signal } from "./signal.js";
import type { AnalystProvider } from "./providers/types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { AnthropicProvider } from "./providers/anthropic.js";

/* ── Şema — tez boyutlarına hizalı olgu çıkarımı ────────────────────────── */

export const CapitalIntensity = z.enum(["low", "medium", "high", "unknown"]);
export type CapitalIntensity = z.infer<typeof CapitalIntensity>;

/**
 * Sinyalin ARKASINDA somut bir teşebbüs var mı? Newsletter'lar görüş yazısı da taşıyor;
 * analist bunları "meta-öğrenme" diye rasyonalize edip yüksek fit veriyordu (bkz. guards (e)).
 * venture/product/funding = kovalanabilir; essay/research/other = kovalanamaz.
 */
export const SignalKind = z.enum(["venture", "product", "funding", "essay", "research", "other"]);
export type SignalKind = z.infer<typeof SignalKind>;

/** Kovalanabilir mi — ortada şirket/ürün/tur var mı? */
export function isActionableKind(k: SignalKind): boolean {
  return k === "venture" || k === "product" || k === "funding";
}

export const EnrichmentFundingSchema = z.object({
  stage: z.string().nullable(), // "seed", "Series B"… null = sayfada yok
  amount: z.string().nullable(), // "$5M"
  total_raised: z.string().nullable(),
  investors: z.array(z.string()).default([]),
});

/** LLM çıktısı — bilinmeyen alan null/unknown kalır, uydurma yasak (prompt). */
export const SignalEnrichmentSchema = z.object({
  signal_kind: SignalKind, // arkasında teşebbüs var mı — essay/research analiz kuyruğuna girmez
  project_summary: z.string().min(1), // 2-3 cümle: ne yapıyor, problem/çözüm, iş modeli
  hq_country: z.string().nullable(),
  markets: z.array(z.string()).default([]), // aktif/hedef pazarlar
  funding: EnrichmentFundingSchema,
  target_users: z.string().nullable(), // KOBİ / enterprise / consumer / developer
  traction: z.string().nullable(), // kullanıcı/gelir sayıları — yalnız sayfada geçiyorsa
  capital_intensity: CapitalIntensity, // tez anti-pattern: sermaye-ağır
  regulation_flags: z.array(z.string()).default([]), // tez anti-pattern: ağır regülasyon
  wtp_signals: z.string().nullable(), // fiyat/ücretli plan/gelir kanıtı — anti-pattern: WTP belirsiz
  sector: z.string().nullable(), // tez sektörlerinden en yakını, yoksa null
  market: z.string().nullable(), // birincil pazar (signals.market backfill)
});
export type SignalEnrichment = z.infer<typeof SignalEnrichmentSchema>;

/**
 * DB'de duran şekil: extraction + worker meta'sı.
 * signal_kind alandan önce yazılmış satırlarda yok — bunlar "other" (kovalanamaz) değil
 * "bilinmiyor"dur: "other"a düşürmek legacy satırları analiz kuyruğundan sessizce sonsuza
 * dek eliyordu. null'a düşer; tüketiciler null'ı "sınıf yok, elemeden geçir" diye okur.
 */
export const StoredEnrichmentSchema = SignalEnrichmentSchema.extend({
  signal_kind: SignalKind.nullable().catch(null),
  fetch_ok: z.boolean(),
  model: z.string(),
  page_chars: z.number().int().nullable(),
  // triage.ts'in ayrı, ucuz çağrısıyla doldurulur (enrichSignal'ın değil) — bkz. triage.ts.
  // Henüz triage edilmemiş / eski satırlarda null; analyze.ts bunu "nötr" sayar.
  triage_score: z.number().int().min(0).max(100).nullable().catch(null),
  triage_reason: z.string().nullable().catch(null),
});
export type StoredEnrichment = z.infer<typeof StoredEnrichmentSchema>;

/* ── Prompt'lar ─────────────────────────────────────────────────────────── */

export function buildEnrichmentSystemPrompt(t: ThesisConfig): string {
  return `Sen bir bilgi-çıkarım asistanısın. Görevin: bir girişim/ürün sinyalinin kaynak sayfa
metninden YALNIZ sayfada geçen olguları yapılandırılmış alanlara çıkarmak. Yorum yapma,
skor verme, tahmin yürütme. Sayfada olmayan bilgiyi UYDURMA — bilinmeyen alanı null bırak,
capital_intensity için "unknown" seç. null/unknown alanlar analist için "doğrulanacak"
demektir; boş bırakmak doğru davranıştır.

Alan rehberi:
- signal_kind: sinyalin ARKASINDA somut bir teşebbüs var mı? Bunu önce belirle:
  · venture  — adı geçen, faaliyette bir şirket/girişim.
  · product  — belirli bir ürün/araç (lansman, launch sayfası).
  · funding  — bir şirketin aldığı somut yatırım turu.
  · essay    — görüş/deneme/tavsiye yazısı, ilke anlatımı, "şu dersi çıkarın" içeriği.
  · research — araştırma, veri/rapor, pazar analizi.
  · other    — hiçbirine uymayan.
  Uyarı: newsletter başlıkları çoğu zaman essay'dir. "Şirketinizi şöyle yönetin", "X neden
  başarısız olur", "Y hakkında düşünceler" → essay. Bir şirket ADI geçmiyorsa venture DEĞİL.
- project_summary: ne yapıyor, hangi problemi nasıl çözüyor, iş modeli (2-3 cümle, Türkçe).
  signal_kind essay/research/other ise: yazının ne savunduğunu 1-2 cümlede özetle, ürün uydurma.
- hq_country / markets: merkez ülke; aktif veya hedeflenen pazarlar.
- funding: tur, miktar, yatırımcılar, toplam — yalnız metinde açıkça geçiyorsa.
- target_users: segment (KOBİ / enterprise / consumer / developer). traction: somut sayılar.
- capital_intensity: donanım/envanter/fiziksel operasyon → high; saf yazılım → low; emin değilsen unknown.
- regulation_flags: lisans/regülasyon gerektiren alanlar (bankacılık, sağlık, sigorta…); yoksa boş liste.
- wtp_signals: fiyatlandırma, ücretli plan, gelir kanıtı; yoksa null.
- sector: şunlardan en yakını veya null: ${t.sectors.join(", ")}.
- market: ürünün birincil pazarı (ülke/bölge) veya null.

Sayfa metni verilmediyse veya alakasızsa yalnız başlık+özetten çıkar; kalan her şeyi null bırak.
Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
}

export function buildEnrichmentUserPrompt(s: Signal, pageText: string | null): string {
  const head = `Sinyal:
- Başlık: ${s.title}
- Kaynak: ${s.source} (${s.type})
- URL: ${s.url}
- Özet: ${s.summary_raw || "(özet yok)"}`;
  const body = pageText
    ? `\n\nSayfa metni (kırpılmış):\n"""\n${pageText}\n"""`
    : "\n\nSayfa çekilemedi — yalnız başlık ve özetten çıkar; bilinmeyenleri null bırak.";
  return `${head}${body}\n\nOlguları JSON olarak çıkar.`;
}

/* ── enrichSignal ───────────────────────────────────────────────────────── */

export interface EnrichOptions {
  provider?: AnalystProvider; // doğrudan inject (test)
  providerName?: "gemini" | "anthropic";
  model?: string;
  apiKey?: string;
  thesis?: ThesisConfig;
  maxRetries?: number;
}

function pickProvider(opts: EnrichOptions): AnalystProvider {
  if (opts.provider) return opts.provider;
  const name = opts.providerName ?? (process.env["ANALYSIS_PROVIDER"] as "gemini" | "anthropic") ?? "gemini";
  const cfg = { apiKey: opts.apiKey, model: opts.model };
  return name === "anthropic" ? new AnthropicProvider(cfg) : new GeminiProvider(cfg);
}

/**
 * Sinyal + (varsa) sayfa metninden tez-hizalı olgu çıkarımı. Sağlayıcı-bağımsız,
 * analyst.ts ile aynı desen: yapısal JSON → zod → şema hatasında feedback'li retry.
 */
export async function enrichSignal(
  signal: Signal,
  pageText: string | null,
  opts: EnrichOptions = {},
): Promise<SignalEnrichment> {
  const provider = pickProvider(opts);
  const thesis = opts.thesis ?? defaultThesis;
  const maxRetries = opts.maxRetries ?? 2;

  const system = buildEnrichmentSystemPrompt(thesis);
  const jsonSchema = zodToJsonSchema(SignalEnrichmentSchema, { target: "jsonSchema7" }) as Record<
    string,
    unknown
  >;
  delete jsonSchema["$schema"];

  const baseUser = buildEnrichmentUserPrompt(signal, pageText);
  let feedback = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const user = feedback ? `${baseUser}\n\n${feedback}` : baseUser;
    const raw = await provider.generate({ system, user, jsonSchema });

    const parsed = SignalEnrichmentSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
    feedback = `Önceki çıktı şema hatası verdi: ${parsed.error.message}. Şemaya uygun düzelt.`;
  }

  throw new Error(
    `enrichment (${provider.name}) ${maxRetries + 1} denemede geçerli çıktı üretemedi (${signal.url})`,
  );
}
