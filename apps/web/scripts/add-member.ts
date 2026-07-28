import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { hashPassword } from "../lib/password";

// Üye tohumlama: parola düz metin DB'ye girmez (scrypt hash).
// PostgREST fetch (supabase-js yok → Node 20 WebSocket sorunu yok).
// kullanım: pnpm --filter @idea-factory/web add-member <username> <display_name> <password>

const here = dirname(fileURLToPath(import.meta.url));
config({ path: [resolve(here, "../../../.env.local"), resolve(here, "../../../.env")] });

async function main() {
  const [username, display, password] = process.argv.slice(2);
  if (!username || !display || !password) {
    console.error("kullanım: tsx scripts/add-member.ts <username> <display_name> <password>");
    process.exit(1);
  }
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok (.env)");
    process.exit(1);
  }

  const password_hash = hashPassword(password);
  // on_conflict=username + merge-duplicates → upsert
  const res = await fetch(`${url}/rest/v1/members?on_conflict=username`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ username, display_name: display, password_hash }),
  });
  if (!res.ok) {
    console.error("hata:", res.status, await res.text());
    process.exit(1);
  }
  console.log(`✓ üye eklendi/güncellendi: ${username} (${display})`);
}

main();
