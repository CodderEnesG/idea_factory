import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// repo kökündeki .env'i yükle (worker'ın cwd'si neresi olursa olsun).
const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Eksik env: ${name} (.env'e ekle — bkz. .env.example)`);
  return val;
}

export const env = {
  supabaseUrl: () => required("SUPABASE_URL"),
  supabaseServiceKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  anthropicKey: () => required("ANTHROPIC_API_KEY"),
  analysisModel: () => process.env["ANALYSIS_MODEL"] ?? "claude-opus-4-8",
};
