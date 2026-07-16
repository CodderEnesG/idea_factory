import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// repo kökündeki env'i yükle (worker'ın cwd'si neresi olursa olsun).
// .env.local öncelikli (dotenv array: ilk dosya kazanır), .env fallback.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: [resolve(here, "../../../.env.local"), resolve(here, "../../../.env")] });

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Eksik env: ${name} (.env'e ekle — bkz. .env.example)`);
  return val;
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  // MVP analist = gemini (ucuz); anthropic sonra. analyst.ts env'i doğrudan okur.
  provider: () => process.env["ANALYSIS_PROVIDER"] ?? "gemini",
  analysisModel: () =>
    env.provider() === "anthropic"
      ? (process.env["ANALYSIS_MODEL"] ?? "claude-opus-4-8")
      : (process.env["GEMINI_MODEL"] ?? "gemini-3.5-flash"),
};
