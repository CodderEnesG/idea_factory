import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { requireAdmin } from "../../../../lib/auth";

export const runtime = "nodejs";

// apps/web -> repo kökü. Yalnız kalıcı bir süreç (pnpm dev, `pnpm cron`) altında anlamlı —
// serverless (Vercel) fonksiyonu istek bitince öldürülür, spawn edilen çocuk süreç yarım kalır.
// Bu yüzden lokal-öncelikli: prod'da bu düğme sessizce başarısız olmasın diye en azından
// süreci başlatmayı DENER, ama garantisi yok (UI metninde de belirtiliyor).
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

/** Admin-only: cron'u beklemeden anlık `pnpm ingest` tetikler (apps/worker/src/ingest.ts).
 *  Fire-and-forget — süreç arka planda çalışır, bu istek hemen döner. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "yetki gerekli (admin)" }, { status: 403 });
  }

  try {
    const child = spawn("pnpm", ["run", "ingest"], {
      cwd: repoRoot,
      detached: true,
      stdio: "ignore",
      shell: true, // Windows'ta pnpm.cmd çözümü için
    });
    child.unref();
    child.on("error", (e) => {
      console.error("[trigger-ingest] başlatılamadı:", e.message);
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "başlatılamadı" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
