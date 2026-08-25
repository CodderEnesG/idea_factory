import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/**
 * Webrazzi'nin Fintech kategori feed'i — genel webrazzi akışı fintech'i çok seyrek
 * yakalıyor (14 gerçek Kovala'nın 0'ı fintech, tezin 4 sektöründen biri hiç temsil
 * edilmiyordu, bkz. 2026-08-25 kaynak-boşluğu analizi). Aynı yayın, dar kategori.
 */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLocaleLowerCase("tr");
  if (/yatırım|fonlama|değerleme|tohum|seed|series\s+[a-e]|milyon dolar|\$\d/.test(t))
    return "funding";
  if (/tanıt|kurul|launch|başlat|yayında|çıkar/.test(t)) return "launch";
  return "company";
}

export const webrazziFintech = wpFeed({
  name: "webrazzi_fintech",
  url: "https://webrazzi.com/kategori/fintech/feed/",
  market: "TR",
  inferType,
});
