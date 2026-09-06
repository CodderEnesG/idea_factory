import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Egirişim — Türkiye girişim haberleri. Webrazzi'nin yanında ikinci yerli kaynak; "TR'de yerleşik
 *  rakip var mı" guard'ı için yerel kapsama genişler. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]|yatırım|fonlama/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut|başlat|tanıt/.test(t)) return "launch";
  return "company";
}

export const egirisim = wpFeed({
  name: "egirisim",
  url: "https://egirisim.com/feed/",
  market: "TR",
  inferType,
});
