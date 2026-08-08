import { thesis as defaultThesis, type ThesisConfig } from "@idea-factory/core";
import { serverDb } from "../../../lib/supabase";
import { requireAdmin } from "../../../lib/auth";
import { getSession } from "../../../lib/auth";
import { Navbar } from "../../../components/Navbar";
import { ThesisForm } from "../../../components/ThesisForm";

export const dynamic = "force-dynamic";

async function loadActiveThesis(): Promise<ThesisConfig> {
  const db = serverDb();
  if (!db) return defaultThesis;
  const { data } = await db
    .from("thesis_versions")
    .select("config")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? (data.config as ThesisConfig) : defaultThesis;
}

export default async function AdminTezPage() {
  const [admin, me] = await Promise.all([requireAdmin(), getSession()]);

  if (!admin) {
    return (
      <div>
        <Navbar me={me} />
        <div className="mx-auto max-w-5xl px-6 py-16 text-center text-sm text-ink-muted">
          Bu sayfa yalnız adminlere açık.
        </div>
      </div>
    );
  }

  const thesis = await loadActiveThesis();

  return (
    <div>
      <Navbar me={me} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold">Tez</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Mevcut versiyon: {thesis.version}. Kaydetmek yeni bir versiyon açar; eski versiyonlar
          denetim/rollback için durur.
        </p>
        <div className="mt-6">
          <ThesisForm initial={thesis} />
        </div>
      </div>
    </div>
  );
}
