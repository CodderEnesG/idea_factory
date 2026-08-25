import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** SaaStr — küresel B2B SaaS topluluğunun en büyük yayını. Diğer kaynakların hepsi
 *  Webrazzi/TechCrunch'ın kategori dilimleriydi (aynı editoryal bakış açısı); bu,
 *  bağımsız, tamamen SaaS-odaklı bir üçüncü yayın (2026-08-25 kullanıcı isteği:
 *  "sadece bunlarla sınırlı kalma"). */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const saastr = wpFeed({
  name: "saastr",
  url: "https://www.saastr.com/feed/",
  inferType,
});
