import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** TechCrunch'ın Commerce kategori feed'i — "e-ticaret altyapısı" sektörünün global
 *  tarafı, bkz. sources/webrazzi-eticaret.ts (TR tarafı) ve webrazzi-fintech.ts notu. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const techcrunchCommerce = wpFeed({
  name: "techcrunch_commerce",
  url: "https://techcrunch.com/category/commerce/feed/",
  inferType,
});
