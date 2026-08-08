import { serverDb } from "../../../lib/supabase";
import { requireAdmin, getSession } from "../../../lib/auth";
import { Navbar } from "../../../components/Navbar";
import { LensManager, type LensRow } from "../../../components/LensManager";

export const dynamic = "force-dynamic";

async function loadLenses(): Promise<LensRow[]> {
  const db = serverDb();
  if (!db) return [];
  const { data } = await db
    .from("lenses")
    .select("lens_id, name, weight, extra_note_label, questions, active, created_by, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []) as LensRow[];
}

export default async function AdminMerceklerPage() {
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

  const customLenses = await loadLenses();

  return (
    <div>
      <Navbar me={me} />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold">Mercekler</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Arbitraj ve Beyaz-alan kod-tanımlı builtin mercekler — burada düzenlenemez. Admin
          yalnız ad + ağırlık + not etiketi + domain soru listesi girer; ön kapı/fit-bant/atıf
          kuralları koddan sabit gelir.
        </p>
        <div className="mt-6">
          <LensManager initial={customLenses} />
        </div>
      </div>
    </div>
  );
}
