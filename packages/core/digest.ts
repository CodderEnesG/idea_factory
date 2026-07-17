import { rank, type RankedItem } from "./ranker.js";
import { fitBand } from "./lenses.config.js";
import { StoredEnrichmentSchema } from "./enrichment.js";

const BAND_LABEL = { pursue: "🟢 KOVALA", watch: "🟡 İZLE", kill: "🔴 ELE" } as const;

export interface DigestOptions {
  topN?: number; // kaç fırsat listelensin (ele bandı digest'e girmez)
  title?: string;
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
  const title = opts.title ?? "Idea Factory — Fırsat Digest'i";
  const ranked = rank(items);
  const shortlist = ranked.filter((r) => fitBand(r.analysis.fit) !== "kill").slice(0, topN);

  const lines: string[] = [`# ${title}`, ""];

  if (shortlist.length === 0) {
    lines.push("_Eşik üstü fırsat yok._", "");
  }

  for (const { signal, analysis } of shortlist) {
    const band = BAND_LABEL[fitBand(analysis.fit)];
    lines.push(
      `## ${band} · fit ${analysis.fit} · ${signal.title}`,
      `${signal.url}`,
      "",
      analysis.rationale,
      "",
    );
    const kunye = buildKunye(signal.enrichment);
    if (kunye) lines.push(`**Künye:** ${kunye}`, "");
    if (analysis.adaptation_notes) lines.push(`**Uyarlama:** ${analysis.adaptation_notes}`, "");
    if (analysis.risks.length) lines.push(`**Riskler:** ${analysis.risks.join("; ")}`, "");
    lines.push(`_Güven: ${analysis.confidence}_`, "");
  }

  // Doğrulama bekleyenler — analistin istediği eksik veriler, insana görev listesi.
  const pending = shortlist.filter((r) => r.analysis.validation_needed.length > 0);
  if (pending.length > 0) {
    lines.push("---", "", "## 🔎 Doğrulama Bekleyenler", "");
    for (const { signal, analysis } of pending) {
      lines.push(`### ${signal.title}`);
      for (const v of analysis.validation_needed) {
        lines.push(`- **${v.data}** — ${v.why} _(nasıl: ${v.how_to_verify})_`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
