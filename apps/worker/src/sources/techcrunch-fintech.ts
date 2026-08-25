import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** TechCrunch'ın Fintech kategori feed'i — genel "startups" kategorisi fintech'i
 *  seyrek yakalıyor, bkz. sources/webrazzi-fintech.ts notu. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const techcrunchFintech = wpFeed({
  name: "techcrunch_fintech",
  url: "https://techcrunch.com/category/fintech/feed/",
  inferType,
});
