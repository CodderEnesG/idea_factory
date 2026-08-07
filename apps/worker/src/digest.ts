import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { buildDigest, type BaseAnalysis, type RankedItem, type Signal } from "@idea-factory/core";
import { db } from "./db.js";

const TOP_N = Number(process.env["DIGEST_TOP_N"] ?? "10");

async function main(): Promise<void> {
  const { data, error } = await db.from("analyses").select("*, signals(*)");
  if (error) throw new Error(`analyses join hatası: ${error.message}`);

  // Tüm mercek satırlarını sinyal başına `analyses` haritasında topla (queue/page.tsx ile aynı desen).
  const bySignal = new Map<string, RankedItem>();
  for (const row of data ?? []) {
    const { signals, ...rest } = row as Record<string, unknown> & { signals?: Signal };
    if (!signals) continue;
    const analysis = rest as unknown as BaseAnalysis;
    const item = bySignal.get(signals.id);
    if (item) item.analyses[analysis.lens] = analysis;
    else bySignal.set(signals.id, { signal: signals, analyses: { [analysis.lens]: analysis } });
  }
  const items = [...bySignal.values()];

  const md = buildDigest(items, { topN: TOP_N });
  const dir = resolve(process.cwd(), "../../digests");
  await mkdir(dir, { recursive: true });
  const out = resolve(dir, `digest-${new Date().toISOString().slice(0, 10)}.md`);
  await writeFile(out, md, "utf8");
  console.log(`✓ digest yazıldı: ${out} (${items.length} sinyal, ${data?.length ?? 0} analiz)`);
}

main().catch((e) => {
  console.error("digest başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
