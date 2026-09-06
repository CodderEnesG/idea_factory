import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Crunchbase News — küresel fonlama haberleri, resmî RSS (ücretli API değil). Tur/sektör
 *  toplu analizleri, tek şirket haberinden çok trend sinyali üretir. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const crunchbaseNews = wpFeed({
  name: "crunchbase_news",
  url: "https://news.crunchbase.com/feed/",
  market: "Global",
  inferType,
});
