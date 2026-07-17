import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Next yalnız apps/web/.env* okur; env'ler repo kökünde. Kökü yükle (worker/eval ile aynı).
// .env.local öncelikli (dotenv array: ilk dosya kazanır), .env fallback.
const here = dirname(fileURLToPath(import.meta.url));
config({ path: [resolve(here, "../../.env.local"), resolve(here, "../../.env")] });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@idea-factory/core"],
};

export default nextConfig;
