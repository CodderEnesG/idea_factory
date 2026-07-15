import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { buildDigest, type ArbitrageAnalysis, type RankedItem, type Signal } from "@idea-factory/core";
import { db } from "./db.js";

const TOP_N = Number(process.env["DIGEST_TOP_N"] ?? "10");

async function main(): Promise<void> {
  const { data, error } = await db
    .from("analyses")
    .select("*, signals(*)")
    .eq("lens", "arbitrage");
  if (error) throw new Error(`analyses join hatası: ${error.message}`);

  const items: RankedItem[] = (data ?? [])
    .filter((row) => row.signals)
    .map((row) => {
      const { signals, ...analysis } = row as Record<string, unknown> & { signals: Signal };
      return { signal: signals, analysis: analysis as unknown as ArbitrageAnalysis };
    });

  const md = buildDigest(items, { topN: TOP_N });
  const dir = resolve(process.cwd(), "../../digests");
  await mkdir(dir, { recursive: true });
  const out = resolve(dir, `digest-${new Date().toISOString().slice(0, 10)}.md`);
  await writeFile(out, md, "utf8");
  console.log(`✓ digest yazıldı: ${out} (${items.length} analiz)`);
}

main().catch((e) => {
  console.error("digest başarısız:", e instanceof Error ? e.message : e);
  process.exit(1);
});
