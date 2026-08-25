import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Sifted (Financial Times destekli) — Avrupa girişim haberleri, bkz. eu-startups.ts notu. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|€\d|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const sifted = wpFeed({
  name: "sifted",
  url: "https://sifted.eu/feed",
  market: "Europe",
  inferType,
});
