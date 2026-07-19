import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/**
 * TechCrunch startups — ücretsiz fonlama/startup feed'i (PLAN.md MVP kaynak listesi).
 * ABD/global turlar arbitraj merceğinin 1. sorusuna (başka pazarda kanıt) ham madde.
 */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const techcrunch = wpFeed({
  name: "techcrunch",
  url: "https://techcrunch.com/category/startups/feed/",
  inferType,
});
