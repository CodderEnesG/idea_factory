import type { SignalType } from "@idea-factory/core";
import { wpFeed } from "./wpfeed.js";

/** TechCrunch Apps — consumer uygulama haberleri (2026-09-14). Havuzun yalnız %4'ü consumer'dı;
 *  bu kategori consumer lansmanları getiriyor. Çoğu dev şirket duyurusu (Meta, Snapchat) —
 *  zenginleştirme onları incumbent_feature diye analizden çıkarır. Verim 1-2 hafta sonra ölçülecek. */
function inferType(title: string, categories: string[]): SignalType {
  const t = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/rais|funding|seed|series\s+[a-e]|valuation|\$\d+(\.\d+)?\s*[mb]/.test(t)) return "funding";
  if (/launch|introduc|releas|unveil|debut/.test(t)) return "launch";
  return "company";
}

export const techcrunchApps = wpFeed({
  name: "techcrunch_apps",
  url: "https://techcrunch.com/category/apps/feed/",
  inferType,
});
