import { requireAdmin } from "../../../lib/auth";
import { getSession } from "../../../lib/auth";
import { loadActiveThesis } from "../../../lib/active-thesis";
import { AppSidebar } from "../../../components/AppSidebar";
import { ThesisForm } from "../../../components/ThesisForm";

export const dynamic = "force-dynamic";

export default async function AdminTezPage() {
  const [admin, me] = await Promise.all([requireAdmin(), getSession()]);

  if (!admin) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar me={me} current="tez" />
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-16 text-center text-sm text-ink-muted">
          Bu sayfa yalnız adminlere açık.
        </div>
      </div>
    );
  }

  const thesis = await loadActiveThesis();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="tez" />
      <div className="min-w-0 flex-1 overflow-y-auto">
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
    </div>
  );
}
