import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Finberg — TR fintech'e özel ikinci bağımsız yayın, bkz. fintechtime.ts notu. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon (dolar|tl)|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const finberg = wpFeed({
  name: "finberg",
  url: "https://www.finberg.com.tr/feed/",
  market: "TR",
  inferType,
});
