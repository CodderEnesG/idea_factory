import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Tech.eu — Avrupa girişim/fonlama haberleri. eu-startups + sifted ile aynı bölge, farklı editör süzgeci:
 *  tur haberlerini daha erken (seed/A) yakalar. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const techEu = wpFeed({
  name: "tech_eu",
  url: "https://tech.eu/feed/",
  market: "Europe",
  inferType,
});
