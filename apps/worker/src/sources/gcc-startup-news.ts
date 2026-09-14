import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** GCC Startup News — Körfez ve Kuzey Afrika girişim haberleri (2026-09-14). MENA consumer
 *  turlarını (ör. Syarah) getiriyor; kalite karışık, verim 1-2 hafta sonra kaynak bazında ölçülecek. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|investment|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const gccStartupNews = wpFeed({
  name: "gcc_startup_news",
  url: "https://www.gccstartup.news/feed/",
  market: "MENA",
  inferType,
});
