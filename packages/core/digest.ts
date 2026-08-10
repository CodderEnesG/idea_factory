import { composite, rank, type RankedItem } from "./ranker.js";
import { lenses, type Lens } from "./lenses.config.js";
import { StoredEnrichmentSchema } from "./enrichment.js";
import { isBench, BENCH_MIN_FIT } from "./bench.js";

const BAND_LABEL = { pursue: "🟢 KOVALA", watch: "🟡 İZLE", kill: "🔴 ELE" } as const;

export interface DigestOptions {
  topN?: number; // kaç fırsat listelensin (ele bandı digest'e girmez)
  title?: string;
  /** builtin + `/admin/mercekler`de eklenmiş aktif admin-mercekleri (PLAN.md §11 madde 3
   *  sağlamlaştırması) — verilmezse yalnız builtin mercekler kullanılır (eski davranış):
   *  custom mercek ağırlığı kompozite girmez VE kendi paragrafı digest'te hiç basılmazdı. */
  lensRegistry?: readonly Lens[];
}

/**
 * Sıralı fırsat digest'i (markdown) + "doğrulama bekleyenler" bölümü.
 * ele bandı listeye alınmaz; doğrulama görevleri tüm izle/kovala'dan toplanır.
 */
/** Zenginleştirmeden tek satır künye: null alanları atla; hiçbir şey yoksa null. */
function buildKunye(enrichment: unknown): string | null {
  const p = StoredEnrichmentSchema.safeParse(enrichment);
  if (!p.success) return null;
  const e = p.data;
  const parts: string[] = [];
  if (e.hq_country) parts.push(e.hq_country);
  if (e.markets.length) parts.push(`pazarlar: ${e.markets.join(", ")}`);
  const f = e.funding;
  if (f.stage || f.amount) parts.push(`${f.stage ?? ""} ${f.amount ?? ""}`.trim());
  if (e.target_users) parts.push(`hedef: ${e.target_users}`);
  if (e.traction) parts.push(`traction: ${e.traction}`);
  return parts.length ? parts.join(" · ") : null;
}

export function buildDigest(items: RankedItem[], opts: DigestOptions = {}): string {
  const topN = opts.topN ?? 10;
  const title = opts.title ?? "IdeaFact — Fırsat Digest'i";
  const lensRegistry = opts.lensRegistry ?? lenses;
  const ranked = rank(items, { lensRegistry });
  const shortlist = ranked
    .filter((r) => composite(r.analyses, lensRegistry).band !== "kill")
    .slice(0, topN);

  const lines: string[] = [`# ${title}`, ""];

  // Bench satırı — topN'e bakılmaksızın tüm çıtayı geçenler (BENCH.md havuz adayları).
  const bench = ranked.filter((r) => isBench(composite(r.analyses, lensRegistry)));
  if (bench.length > 0) {
    lines.push(
      `**🏅 Bench:** ${bench.length} fırsat çıtayı geçiyor (fit ≥ ${BENCH_MIN_FIT} · güven yüksek) — BENCH.md havuz adayı.`,
      "",
    );
  }

  if (shortlist.length === 0) {
    lines.push("_Eşik üstü fırsat yok._", "");
  }

  for (const { signal, analyses } of shortlist) {
    const comp = composite(analyses, lensRegistry);
    const band = BAND_LABEL[comp.band];
    lines.push(
      `## ${band} · fit ${comp.fit}${isBench(comp) ? " · 🏅 bench" : ""} · ${signal.title}`,
      `${signal.url}`,
      "",
    );
    const kunye = buildKunye(signal.enrichment);
    if (kunye) lines.push(`**Künye:** ${kunye}`, "");

    // Her aktif mercek kendi paragrafında — kompozit skor yalnız sıralar, gerekçe mercek-özeldir.
    for (const lens of lensRegistry) {
      const a = analyses[lens.id];
      if (!a) continue;
      lines.push(`**${lens.name}** (fit ${a.fit} · güven ${a.confidence}): ${a.rationale}`, "");
      if (lens.extraNote(a)) lines.push(`_${lens.extraNoteLabel}:_ ${lens.extraNote(a)}`, "");
      if (a.risks.length) lines.push(`_Riskler:_ ${a.risks.join("; ")}`, "");
    }
  }

  // Doğrulama bekleyenler — analistin istediği eksik veriler, insana görev listesi (mercek etiketli).
  const pending = shortlist.filter((r) => Object.values(r.analyses).some((a) => a.validation_needed.length > 0));
  if (pending.length > 0) {
    lines.push("---", "", "## 🔎 Doğrulama Bekleyenler", "");
    for (const { signal, analyses } of pending) {
      lines.push(`### ${signal.title}`);
      for (const lens of lenses) {
        const a = analyses[lens.id];
        if (!a || a.validation_needed.length === 0) continue;
        for (const v of a.validation_needed) {
          lines.push(`- **[${lens.name}] ${v.data}** — ${v.why} _(nasıl: ${v.how_to_verify})_`);
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
