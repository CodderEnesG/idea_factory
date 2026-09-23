import { ttlCache } from "./ttl-cache";

/** Çalışma alanının yardımcı tabloları (mercek, karar, görev, yorum, tartışma): 30 sn önbellekli.
 *  Hafif ayrı modül: yazma rotaları `bustContextCache()` için ağır `workspace.ts`'i içe aktarmasın. */
export const sharedCtx = ttlCache("ctx", 30_000);
export const bustContextCache = (): void => sharedCtx.bust();
