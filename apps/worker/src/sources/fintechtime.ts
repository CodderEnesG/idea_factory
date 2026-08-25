import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** Fintechtime — TR fintech'e özel bağımsız yayın (Webrazzi'nin fintech kategorisinden
 *  farklı editoryal kaynak, aynı sektörü ikinci bir açıdan tarar). */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon (dolar|tl)|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const fintechtime = wpFeed({
  name: "fintechtime",
  url: "https://fintechtime.com/feed/",
  market: "TR",
  inferType,
});
