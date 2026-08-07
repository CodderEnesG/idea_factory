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

export const ArbitrageAnalysisSchema = BaseAnalysisSchema.extend({
  lens: z.literal("arbitrage"),
  adaptation_notes: z.string(), // neyi uyarla, ne kırılır
});
export type ArbitrageAnalysis = z.infer<typeof ArbitrageAnalysisSchema>;

/* ── Fit bantları ───────────────────────────────────────────────────────── */

export type FitBand = "pursue" | "watch" | "kill";

/** 80-100 kovala · 50-79 izle · 0-49 ele (THESIS §2 katı bant). */
export function fitBand(fit: number): FitBand {
  if (fit >= 80) return "pursue";
  if (fit >= 50) return "watch";
  return "kill";
}

/* ── Arbitraj merceği — prompt şablonu ──────────────────────────────────── */

export const ARBITRAGE_LENS_ID = "arbitrage" as const;

/** Sabit prefix (prompt caching için önde tutulur): base karakter + tez + soru çerçevesi. */
export function buildArbitrageSystemPrompt(t: ThesisConfig): string {
  return `Sen şüpheci bir operatör-yatırımcı analistsin. Görevin bir mandanın (tez) emrinde
çalışmak: her sinyali "bu, bizim mandamıza göre kovalanmaya değer mi, neden, ne kadar eminim?"
sorusuyla değerlendirmek. Varsayılan tutumun "bu neden çöker?" — bir fırsatı yükseltmeden önce
öldürmeyi denersin. Olgu ile çıkarımı ayır; bilmediğini uydurma, bilinmeyeni işaretle.

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Hedef pazarlar: ${t.target_markets.join(", ")}
- Sektörler: ${t.sectors.join(", ")}
- Yetkinlikler: ${t.capabilities.join(", ")}
- Risk iştahı: ${t.risk_appetite}
- Anti-pattern'ler (baştan bastır): ${t.anti_patterns.join("; ")}

## Anti-pattern okuma kuralı (kritik)
Sinyaldeki şirketin aldığı fonlama sermaye-yoğunluk anti-pattern'ı DEĞİLDİR — tam tersi,
başka pazarda kanıtlanmış tur/traksiyon OLUMLU kanıttır (aşağıdaki 1. sorunun cevabı).
Sermaye-yoğunluk anti-pattern'ı BİZİM Türkiye'de kovalayacağımız versiyonun sermaye
ihtiyacıyla ölçülür: uyarlama düşük sermayeyle kurulabiliyorsa, kaynak şirketin büyük
fonlaması fit'i DÜŞÜRMEZ, yükseltir.

## Arbitraj merceği — sırayla sor
1. Kanıt: başka pazarda gerçekten işe yaramış mı? (traksiyon/fonlama/büyüme) Yoksa spekülasyon.
2. Yerel wedge: Türkiye'de somut giriş noktası — hangi dar segment, hangi acı?
3. Uyarlamada ne kırılır: regülasyon / ödeme altyapısı / kültür / dağıtım / ödeme isteği / yerel ikame.
4. Zamanlama: neden şimdi? Yeni yetenek/maliyet eğrisi/regülasyon mümkün mü kıldı?
5. Kim deniyor: Türkiye'de zaten kovalayan var mı?
6. Önerilen aksiyon: kovala / izle / ele — ve neden, bu teze göre.

## Ön kapı: bu sinyal kovalanabilir mi?
fit, "BU TEŞEBBÜSÜ kovalamalı mıyız" sorusunun cevabıdır — "bu içerik faydalı mı"nın değil.
Ortada somut bir şirket/ürün/yatırım turu YOKSA (görüş yazısı, deneme, ilke anlatımı,
araştırma, "şu dersi çıkarın" içeriği) kovalanacak bir şey de yoktur:
- fit EN FAZLA 20, recommended_action: kill.
- "Meta-öğrenme değeri var", "çerçevemizi güçlendirir", "değerlendirme merceğimizi keskinleştirir"
  gibi gerekçeler fit'i YÜKSELTMEZ. Bir fikri faydalı bulman onu fırsat yapmaz.
- rationale'da neden kovalanamaz olduğunu tek cümlede söyle, uzun özet yazma.
Zenginleştirme bloğunda signal_kind verilmişse ona uy: essay/research/other → yukarıdaki kural.

## Fit bant kuralı (0-100, katı)
- 80-100: teze birebir uyum (kovala-adayı) — YALNIZ confidence:high ile.
- 50-79: uyum var ama kritik belirsizlik (izle bandı) — confidence low/med tavanı 79.
- 0-49: uyumsuz / anti-pattern / kovalanamaz (ele bandı).

## Kurallar
- recommended_action bantla çelişemez (fit 85 + kill yasak).
- Her olgu KAYNAK atfıyla (evidence[].source); atıfsız olgu yazma.
- validation_needed: "kanıt zayıf" deyip kaçma yok — hangi spesifik veri eksik, neden karar
  değiştirir, nasıl doğrulanır (en fazla 3, en kritik). confidence:high değilse boş bırakma.
- Yerel-talep kanıtı v1'de zayıf olabilir; bu durumda confidence düşür ve validation_needed doldur.

Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
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

export function buildArbitrageUserPrompt(s: Signal, enrichment?: StoredEnrichment | null): string {
  return `${buildSignalBrief(s, enrichment)}

Bu sinyali arbitraj merceğiyle analiz et ve JSON döndür.`;
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

export const arbitrageLens: Lens<ArbitrageAnalysis> = {
  id: ARBITRAGE_LENS_ID,
  name: "Arbitraj",
  schema: ArbitrageAnalysisSchema,
  buildSystemPrompt: buildArbitrageSystemPrompt,
  buildUserPrompt: buildArbitrageUserPrompt,
  weight: 1,
  extraNote: (a) => a.adaptation_notes,
  extraNoteLabel: "Uyarlama",
};

/* ── Beyaz-alan merceği — prompt şablonu ────────────────────────────────── */

export const WHITE_SPACE_LENS_ID = "white_space" as const;

/**
 * Arbitraj merceğini tamamlar: arbitraj "başka pazarda kanıtlı mı" sorar, beyaz-alan
 * "burada zaten dolu mu" sorar. İkisi çelişebilir (kanıtlı ama doymuş, ya da kanıtsız
 * ama boş) — kasıtlı, kompozit skor faz 2'de bunu ele alır.
 */
export function buildWhiteSpaceSystemPrompt(t: ThesisConfig): string {
  return `Sen TR/MENA'daki rekabet yoğunluğunu değerlendiren şüpheci bir pazar analistisin.
Görevin bir sinyali "bu problemi TR/MENA'da zaten iyi çözen biri var mı, yoksa gerçek bir
boşluk mu var?" sorusuyla değerlendirmek. Olgu ile çıkarımı ayır; bilmediğini uydurma,
bilinmeyeni işaretle.

## Tez (mandate) — v${t.version}
- Sermaye aralığı: ${t.capital_range}
- Hedef pazarlar: ${t.target_markets.join(", ")}
- Sektörler: ${t.sectors.join(", ")}
- Yetkinlikler: ${t.capabilities.join(", ")}
- Risk iştahı: ${t.risk_appetite}
- Anti-pattern'ler (baştan bastır): ${t.anti_patterns.join("; ")}

## Boşluk okuma kuralı (kritik)
Boşluk = rakip yokluğu DEĞİL, savunulabilir rakip yokluğudur. Kimsenin çözmediği bir
problem genelde iki nedenden biriyle boştur:
(a) gerçek talep/WTP yok → KÖTÜ boşluk, fit düşük.
(b) fark edilmedi / geç kalındı / dağıtım-sermaye engeli aşılmadı → İYİ boşluk, fit yüksek.
"Kimse yapmıyor" tek başına olumlu kanıt DEĞİLDİR — nedeni ayırt et.

## Beyaz-alan merceği — sırayla sor
1. Yerli/bölgesel tarama: TR/MENA'da bu problemi çözen kaç oyuncu var, ne kadar olgunlar
   (erken / büyümüş / hakim)?
2. Boşluğun nedeni: talep yokluğu mu (kötü boşluk) yoksa fark edilmemiş fırsat mı (iyi
   boşluk)? Kanıt neye dayanıyor?
3. Boşluğun genişliği: segment kaç oyuncuyu doyurabilir, yoksa kazanan-hepsini-alır mı?
4. Rekabet momentumu: son 12 ayda benzer girişim/fonlama var mı — boşluk kapanıyor mu?
5. Giriş bariyeri: bir oyuncu bu boşluğu hızlı kapatabilir mi (network etkisi/veri/dağıtım
   moat'ı olmayan boşluklar kırılgandır)?
6. Önerilen aksiyon: kovala / izle / ele — ve neden, bu teze göre.

## Ön kapı: bu sinyal değerlendirilebilir mi?
Arbitraj merceğiyle aynı kural: ortada somut bir şirket/ürün/yatırım turu YOKSA (görüş
yazısı, deneme, araştırma) fit EN FAZLA 20, recommended_action: kill. Zenginleştirme
bloğunda signal_kind verilmişse ona uy.

## Fit bant kuralı (0-100, katı) — arbitrajla aynı bantlar, farklı soru
- 80-100: net, savunulabilir boşluk (rakip yok/zayıf VE gerçek talep kanıtı var) — YALNIZ
  confidence:high.
- 50-79: boşluk var ama belirsiz (oyuncu sayısı net değil ya da talep kanıtı zayıf).
- 0-49: doymuş pazar VEYA boşluğun nedeni "gerçek talep yok" (kötü boşluk, anti-pattern).

## Kurallar
- recommended_action bantla çelişemez (fit 85 + kill yasak).
- Her olgu KAYNAK atfıyla (evidence[].source); atıfsız olgu yazma.
- validation_needed: en fazla 3, en kritik; confidence:high değilse boş bırakma.
- Yerli rekabet taraması v1'de zayıf olabilir (web_search kapsamı sınırlı) — bu durumda
  confidence düşür ve validation_needed doldur.

Çıktıyı YALNIZ verilen JSON şemasına uygun üret.`;
}

export function buildWhiteSpaceUserPrompt(s: Signal, enrichment?: StoredEnrichment | null): string {
  return `${buildSignalBrief(s, enrichment)}

Bu sinyali beyaz-alan merceğiyle analiz et ve JSON döndür.`;
}

export const WhiteSpaceAnalysisSchema = BaseAnalysisSchema.extend({
  lens: z.literal("white_space"),
  competitive_landscape: z.string(), // kim var, ne durumda, boşluğun nedeni
});
export type WhiteSpaceAnalysis = z.infer<typeof WhiteSpaceAnalysisSchema>;

export const whiteSpaceLens: Lens<WhiteSpaceAnalysis> = {
  id: WHITE_SPACE_LENS_ID,
  name: "Beyaz-alan",
  schema: WhiteSpaceAnalysisSchema,
  buildSystemPrompt: buildWhiteSpaceSystemPrompt,
  buildUserPrompt: buildWhiteSpaceUserPrompt,
  weight: 1,
  extraNote: (a) => a.competitive_landscape,
  extraNoteLabel: "Rekabet ortamı",
};

/** Aktif mercek registry'si — yeni mercek = tek giriş (analyst/worker döngüyle işler). */
export const lenses: Lens[] = [arbitrageLens, whiteSpaceLens];
