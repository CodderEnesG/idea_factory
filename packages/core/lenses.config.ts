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

export const ArbitrageAnalysisSchema = z.object({
  lens: z.literal("arbitrage"),
  fit: z.number().int().min(0).max(100), // teze uyum — katı bant kuralı
  rationale: z.string().min(1),
  evidence: z.array(EvidenceItem),
  adaptation_notes: z.string(), // neyi uyarla, ne kırılır
  risks: z.array(z.string()), // en güçlü kill gerekçesi dahil
  confidence: Confidence,
  validation_needed: z.array(ValidationItem).max(3), // zorunlu Validation Block
  recommended_action: RecommendedAction,
  tags: z.array(z.string()).default([]),
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

export function buildArbitrageUserPrompt(s: Signal, enrichment?: StoredEnrichment | null): string {
  const head = `Sinyal:
- Başlık: ${s.title}
- Kaynak: ${s.source} (${s.type})
- URL: ${s.url}
- Pazar: ${s.market ?? "bilinmiyor"}
- Sektör: ${s.sector ?? "bilinmiyor"}
- Özet: ${s.summary_raw || "(özet yok)"}`;

  let enr = "";
  if (enrichment) {
    const e = enrichment;
    const f = e.funding;
    const funding =
      f.stage || f.amount || f.total_raised || f.investors.length
        ? `${f.stage ?? "?"} ${f.amount ?? ""}`.trim() +
          (f.total_raised ? ` (toplam: ${f.total_raised})` : "") +
          (f.investors.length ? ` — yatırımcılar: ${f.investors.join(", ")}` : "")
        : "bilinmiyor";
    enr = `

Zenginleştirme (kaynak sayfadan çıkarılmış olgular; null/bilinmiyor = sayfada yoktu, UYDURMA):
- Sinyal tipi: ${e.signal_kind}${isActionableKind(e.signal_kind) ? "" : " ← kovalanabilir teşebbüs YOK: fit ≤ 20 + kill (ön kapı kuralı)"}
- Proje: ${e.project_summary}
- Merkez: ${e.hq_country ?? "bilinmiyor"} · Pazarlar: ${e.markets.join(", ") || "bilinmiyor"}
- Fonlama: ${funding}
- Hedef kullanıcı: ${e.target_users ?? "bilinmiyor"} · Traction: ${e.traction ?? "yok"}
- Sermaye yoğunluğu: ${e.capital_intensity} · Regülasyon: ${e.regulation_flags.join(", ") || "yok"} · WTP: ${e.wtp_signals ?? "belirsiz"}${e.fetch_ok ? "" : "\n(sayfa çekilemedi — yalnız başlık/özet bazlı, güvenilirlik düşük)"}
Bilinmeyen alanları validation_needed adayı olarak değerlendir.`;
  }

  return `${head}${enr}

Bu sinyali arbitraj merceğiyle analiz et ve JSON döndür.`;
}

export interface Lens {
  id: typeof ARBITRAGE_LENS_ID;
  name: string;
  schema: typeof ArbitrageAnalysisSchema;
  buildSystemPrompt: (t: ThesisConfig) => string;
  buildUserPrompt: (s: Signal, enrichment?: StoredEnrichment | null) => string;
  weight: number;
}

export const arbitrageLens: Lens = {
  id: ARBITRAGE_LENS_ID,
  name: "Arbitraj",
  schema: ArbitrageAnalysisSchema,
  buildSystemPrompt: buildArbitrageSystemPrompt,
  buildUserPrompt: buildArbitrageUserPrompt,
  weight: 1,
};

/** v1: tek mercek. Yeni mercek = tek giriş. */
export const lenses: Lens[] = [arbitrageLens];
