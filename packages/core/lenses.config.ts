import { z } from "zod";
import type { ThesisConfig } from "./thesis.config.js";
import type { Signal } from "./signal.js";
import { isActionableKind, type StoredEnrichment } from "./enrichment.js";

/* ── Çıktı şeması (THESIS_AND_LENS.md §2) ───────────────────────────────── */

export const RecommendedAction = z.enum(["pursue", "watch", "kill"]);
export type RecommendedAction = z.infer<typeof RecommendedAction>;

export const Confidence = z.enum(["low", "med", "high"]);
export type Confidence = z.infer<typeof Confidence>;

export const EvidenceItem = z.object({
  fact: z.string().min(1),
  source: z.string().min(1), // atıfsız olgu reddedilir (guard)
});

export const ValidationItem = z.object({
  data: z.string().min(1), // hangi spesifik veri eksik
  why: z.string().min(1), // neden karar değiştirir
  how_to_verify: z.string().min(1), // nasıl doğrulanır (web / insan / mülakat)
});

/**
 * Merceklerin ortak çıktı iskeleti — guard'lar ve ranker/UI bu alanlara bakar.
 * Her mercek bunu `.extend()` ile kendi `lens` literal'i + ekstra alanlarla genişletir
 * (bkz. `ArbitrageAnalysisSchema`). Yeni mercek eklemek şemayı değil bu tabanı bozmaz.
 */
export const BaseAnalysisSchema = z.object({
  lens: z.string(),
  fit: z.number().int().min(0).max(100), // teze uyum — katı bant kuralı
  rationale: z.string().min(1),
  evidence: z.array(EvidenceItem),
  risks: z.array(z.string()), // en güçlü kill gerekçesi dahil
  confidence: Confidence,
  validation_needed: z.array(ValidationItem).max(3), // zorunlu Validation Block
  recommended_action: RecommendedAction,
  tags: z.array(z.string()).default([]),
});
export type BaseAnalysis = z.infer<typeof BaseAnalysisSchema>;

/* ── Fit bantları ───────────────────────────────────────────────────────── */

export type FitBand = "pursue" | "watch" | "kill";

/** 80-100 kovala · 50-79 izle · 0-49 ele (THESIS §2 katı bant). */
export function fitBand(fit: number): FitBand {
  if (fit >= 80) return "pursue";
  if (fit >= 50) return "watch";
  return "kill";
}

/** Sinyal + zenginleştirme bloğu — tüm merceklerin (ve triage'ın) user prompt'u bunun üstüne kurulur. */
export function buildSignalBrief(s: Signal, enrichment?: StoredEnrichment | null): string {
  const head = `Sinyal:
- Başlık: ${s.title}
- Kaynak: ${s.source} (${s.type})
- URL: ${s.url}
- Pazar: ${s.market ?? "bilinmiyor"}
- Sektör: ${s.sector ?? "bilinmiyor"}
- Özet: ${s.summary_raw || "(özet yok)"}`;

  if (!enrichment) return head;

  const e = enrichment;
  const f = e.funding;
  const funding =
    f.stage || f.amount || f.total_raised || f.investors.length
      ? `${f.stage ?? "?"} ${f.amount ?? ""}`.trim() +
        (f.total_raised ? ` (toplam: ${f.total_raised})` : "") +
        (f.investors.length ? ` — yatırımcılar: ${f.investors.join(", ")}` : "")
      : "bilinmiyor";
  const enr = `

Zenginleştirme (kaynak sayfadan çıkarılmış olgular; null/bilinmiyor = sayfada yoktu, UYDURMA):
- Sinyal tipi: ${e.signal_kind ?? "bilinmiyor"}${e.signal_kind && !isActionableKind(e.signal_kind) ? " ← kovalanabilir teşebbüs YOK: fit ≤ 20 + kill (ön kapı kuralı)" : ""}
- Proje: ${e.project_summary}
- Merkez: ${e.hq_country ?? "bilinmiyor"} · Pazarlar: ${e.markets.join(", ") || "bilinmiyor"}
- Fonlama: ${funding}
- Hedef kullanıcı: ${e.target_users ?? "bilinmiyor"} · Traction: ${e.traction ?? "yok"}
- Sermaye yoğunluğu: ${e.capital_intensity} · Regülasyon: ${e.regulation_flags.join(", ") || "yok"} · WTP: ${e.wtp_signals ?? "belirsiz"}${e.fetch_ok ? "" : "\n(sayfa çekilemedi — yalnız başlık/özet bazlı, güvenilirlik düşük)"}
Bilinmeyen alanları validation_needed adayı olarak değerlendir.`;

  return `${head}${enr}`;
}

export interface Lens<TAnalysis extends BaseAnalysis = BaseAnalysis> {
  id: string;
  name: string;
  schema: z.ZodType<TAnalysis, z.ZodTypeDef, unknown>;
  buildSystemPrompt: (t: ThesisConfig) => string;
  buildUserPrompt: (s: Signal, enrichment?: StoredEnrichment | null) => string;
  weight: number;
  /** DB'deki paylaşılan "mercek-özel not" kolonuna yazılacak metni analizden çıkarır.
   *  Method-şekli (bivariant param) kasıtlı: heterojen `Lens<T>[]` dizisine sığması için. */
  extraNote(a: TAnalysis): string;
  /** UI'da extraNote'un önüne konan etiket (ör. "Uyarlama", "Rekabet ortamı"). */
  extraNoteLabel: string;
}

/** Hiç mercek tanımlanmamışsa (ilk kurulum / DB yok) düşülecek boş kayıt — tüm mercekler artık
 *  admin-merceği (aşağıdaki `ARBITRAGE_SEED_LENS`/`WHITE_SPACE_SEED_LENS` dahil, bkz. o bölüm). */
export const lenses: Lens[] = [];

/* ── Admin-mercekleri — iskeletli soru editörü (PLAN.md §10-C) ─────────────
 * Admin panelinden (`/admin` → Mercekler) DB'ye eklenen mercekler. Admin ad + ağırlık +
 * "extra_note" etiketi + domain soru listesi girer — ön kapı / fit-bant / atıf / güven-kapısı
 * kuralları burada SABİT kalır, admin bunları bozamaz. Eskiden "arbitraj"/"beyaz-alan" ayrı
 * hardcoded Zod şemalarıyla (builtin) yaşardı; 2026-08-15'te bu ayrım kaldırıldı — artık ikisi
 * de sıradan admin-merceği (aynı genel şema, aynı düzenleme arayüzü). lens_id'leri ("arbitrage",
 * "white_space") DB'de ve golden few-shot setinde (eval/golden.ts) sabit kalmalı — değiştirilirse
 * hem geçmiş `analyses` satırları hem few-shot kalibrasyonu kopar. */

export interface CustomLensDef {
  id: string; // slug, DB `lenses.lens_id`
  name: string;
  weight: number;
  extraNoteLabel: string;
  questions: string[]; // admin'in girdiği domain soru listesi, sırayla sorulur
}

export function buildCustomLensSchema(id: string) {
  return BaseAnalysisSchema.extend({
    lens: z.literal(id),
    extra_note: z.string(), // admin'in extraNoteLabel'ıyla etiketlenen tek genel alan
  });
}
export type CustomAnalysis = z.infer<ReturnType<typeof buildCustomLensSchema>>;

function buildCustomSystemPrompt(def: CustomLensDef, t: ThesisConfig): string {
  return `Sen şüpheci bir operatör-yatırımcı analistsin. Görevin bir mandanın (tez) emrinde
çalışmak: her sinyali "${def.name}" merceğinden değerlendirmek — "bu, bizim mandamıza göre
kovalanmaya değer mi, neden, ne kadar eminim?" Olgu ile çıkarımı ayır; bilmediğini uydurma,
bilinmeyeni işaretle.

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Hedef pazarlar: ${t.target_markets.join(", ")}
- Sektörler: ${t.sectors.join(", ")}
- Yetkinlikler: ${t.capabilities.join(", ")}
- Risk iştahı: ${t.risk_appetite}
- Anti-pattern'ler (baştan bastır): ${t.anti_patterns.join("; ")}

## ${def.name} merceği — sırayla sor
${def.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}
Son olarak: Önerilen aksiyon: kovala / izle / ele — ve neden, bu teze göre.

## Ön kapı: bu sinyal kovalanabilir mi?
fit, "BU TEŞEBBÜSÜ kovalamalı mıyız" sorusunun cevabıdır — "bu içerik faydalı mı"nın değil.
Ortada somut bir şirket/ürün/yatırım turu YOKSA (görüş yazısı, deneme, ilke anlatımı,
araştırma) kovalanacak bir şey de yoktur: fit EN FAZLA 20, recommended_action: kill.
Zenginleştirme bloğunda signal_kind verilmişse ona uy.

## Fit bant kuralı (0-100, katı)
- 80-100: teze birebir uyum (kovala-adayı) — YALNIZ confidence:high ile.
- 50-79: uyum var ama kritik belirsizlik (izle bandı) — confidence low/med tavanı 79.
- 0-49: uyumsuz / anti-pattern / kovalanamaz (ele bandı).

## Kurallar
- recommended_action bantla çelişemez (fit 85 + kill yasak).
- Her olgu KAYNAK atfıyla (evidence[].source); atıfsız olgu yazma.
- validation_needed: en fazla 3, en kritik; confidence:high değilse boş bırakma.
- extra_note alanına "${def.extraNoteLabel}" başlığı altında özet bir not yaz.

Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
}

/** Admin panelindeki bir mercek tanımından çalışan bir `Lens` üretir (worker + UI paylaşır). */
export function buildCustomLens(def: CustomLensDef): Lens<CustomAnalysis> {
  return {
    id: def.id,
    name: def.name,
    schema: buildCustomLensSchema(def.id),
    buildSystemPrompt: (t) => buildCustomSystemPrompt(def, t),
    buildUserPrompt: (s, e) =>
      `${buildSignalBrief(s, e)}\n\nBu sinyali ${def.name} merceğiyle analiz et ve JSON döndür.`,
    weight: def.weight,
    extraNote: (a) => a.extra_note,
    extraNoteLabel: def.extraNoteLabel,
  };
}

/* ── Arbitraj / Beyaz-alan tohum tanımları ──────────────────────────────────
 * Eskiden bu iki mercek kendi hardcoded prompt'u + Zod şemasıyla "builtin" yaşardı
 * (bkz. git geçmişi). 2026-08-15'te sıradan admin-merceğine taşındı: `lenses` tablosunda
 * bu id'lerle bir satır yoksa `apps/worker/scripts/migrate-builtin-lenses.ts` bu sabitlerden
 * seed eder. Özgün prompt'taki "okuma kuralları" (fonlama ≠ anti-pattern, boşluk ≠ rakip
 * yokluğu) admin-mercek şablonunun tek mekanizmasına (sıralı soru listesi) uysun diye 1.
 * soru olarak gömülü — biçim değişti, içerik aynı. `id` DEĞİŞTİRİLEMEZ (yukarıdaki not). */
export const ARBITRAGE_SEED_LENS: CustomLensDef = {
  id: "arbitrage",
  name: "Arbitraj",
  weight: 1,
  extraNoteLabel: "Uyarlama",
  questions: [
    "Anti-pattern okuma kuralı: sinyaldeki şirketin aldığı fonlama sermaye-yoğunluk " +
      "anti-pattern'ı DEĞİLDİR — başka pazarda kanıtlanmış tur/traksiyon OLUMLU kanıttır. " +
      "Sermaye-yoğunluk anti-pattern'ı BİZİM Türkiye'de kovalayacağımız versiyonun sermaye " +
      "ihtiyacıyla ölçülür: uyarlama düşük sermayeyle kurulabiliyorsa, kaynak şirketin büyük " +
      "fonlaması fit'i DÜŞÜRMEZ, yükseltir.",
    "Kanıt: başka pazarda gerçekten işe yaramış mı? (traksiyon/fonlama/büyüme) Yoksa spekülasyon.",
    "Yerel wedge: Türkiye'de somut giriş noktası — hangi dar segment, hangi acı?",
    "Uyarlamada ne kırılır: regülasyon / ödeme altyapısı / kültür / dağıtım / ödeme isteği / yerel ikame.",
    "Zamanlama: neden şimdi? Yeni yetenek/maliyet eğrisi/regülasyon mümkün mü kıldı?",
    "Kim deniyor: Türkiye'de zaten kovalayan var mı?",
  ],
};

export const WHITE_SPACE_SEED_LENS: CustomLensDef = {
  id: "white_space",
  name: "Beyaz-alan",
  // 0 = kompozit SKORA girmez; kartta/haritada/trendde ikinci görüş olarak görünmeye devam
  // eder (kullanıcı kararı 2026-08-10, THESIS_AND_LENS.md §3a'da detay). Grounding (PLAN.md
  // §11 madde 2) devreye girince 1'e çıkarılmalı — asıl tasarım o.
  weight: 0,
  extraNoteLabel: "Rekabet ortamı",
  questions: [
    "Boşluk okuma kuralı: boşluk = rakip yokluğu DEĞİL, savunulabilir rakip yokluğudur. " +
      "Gerçek talep/WTP yoksa KÖTÜ boşluk (fit düşük); fark edilmedi/geç kalındı/dağıtım-sermaye " +
      "engeli aşılmadıysa İYİ boşluk (fit yüksek). 'Kimse yapmıyor' tek başına olumlu kanıt " +
      "DEĞİLDİR — nedeni ayırt et.",
    "Yerli/bölgesel tarama: TR/MENA'da bu problemi çözen kaç oyuncu var, ne kadar olgunlar (erken / büyümüş / hakim)?",
    "Boşluğun nedeni: talep yokluğu mu (kötü boşluk) yoksa fark edilmemiş fırsat mı (iyi boşluk)? Kanıt neye dayanıyor?",
    "Boşluğun genişliği: segment kaç oyuncuyu doyurabilir, yoksa kazanan-hepsini-alır mı?",
    "Rekabet momentumu: son 12 ayda benzer girişim/fonlama var mı — boşluk kapanıyor mu?",
    "Giriş bariyeri: bir oyuncu bu boşluğu hızlı kapatabilir mi (network etkisi/veri/dağıtım moat'ı olmayan boşluklar kırılgandır)?",
  ],
};
