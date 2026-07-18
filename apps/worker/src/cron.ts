import "./env.js"; // repo kökündeki .env'i yükle (CRON_* dahil)
import cron from "node-cron";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * PLAN.md faz 7: ingest+analiz cron'a bağlanır. Tek tick = pnpm run tick
 * (topla → zenginleştir → analiz → digest). Uzun ömürlü süreç:
 *   pnpm cron            — varsayılan: her gün 07:00 ve 19:00 (Europe/Istanbul)
 *   CRON_SCHEDULE="0 8 * * *" pnpm cron
 *   CRON_RUN_ON_START=true pnpm cron   — başlar başlamaz bir tick koş
 */
const SCHEDULE = process.env["CRON_SCHEDULE"] ?? "0 7,19 * * *";
const TZ = process.env["CRON_TZ"] ?? "Europe/Istanbul";
const RUN_ON_START = process.env["CRON_RUN_ON_START"] === "true";

const workerDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let running = false;

function tick(): void {
  if (running) {
    console.warn(`[cron] önceki tick hâlâ sürüyor, bu tetik atlandı (${new Date().toISOString()})`);
    return;
  }
  running = true;
  console.log(`[cron] tick başladı: ${new Date().toISOString()}`);
  const child = spawn("pnpm", ["run", "tick"], {
    cwd: workerDir,
    stdio: "inherit",
    shell: true, // Windows'ta pnpm.cmd çözümü için
  });
  child.on("close", (code) => {
    running = false;
    console.log(`[cron] tick bitti (exit ${code ?? "?"}): ${new Date().toISOString()}`);
  });
  child.on("error", (e) => {
    running = false;
    console.error("[cron] tick başlatılamadı:", e.message);
  });
}

if (!cron.validate(SCHEDULE)) {
  console.error(`[cron] geçersiz CRON_SCHEDULE: "${SCHEDULE}"`);
  process.exit(1);
}

cron.schedule(SCHEDULE, tick, { timezone: TZ });
console.log(`[cron] zamanlandı: "${SCHEDULE}" (${TZ}) — topla→zenginleştir→analiz→digest`);
if (RUN_ON_START) tick();
