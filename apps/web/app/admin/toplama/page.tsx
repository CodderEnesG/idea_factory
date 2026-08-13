import { requireAdmin, getSession } from "../../../lib/auth";
import { loadActiveIngestionSettings } from "../../../lib/active-ingestion-settings";
import { AppSidebar } from "../../../components/AppSidebar";
import { IngestionSettingsForm } from "../../../components/IngestionSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminToplamaPage() {
  const [admin, me] = await Promise.all([requireAdmin(), getSession()]);

  if (!admin) {
    return (
      <div className="flex h-screen overflow-hidden">
        <AppSidebar me={me} current="toplama" />
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-16 text-center text-sm text-ink-muted">
          Bu sayfa yalnız adminlere açık.
        </div>
      </div>
    );
  }

  const settings = await loadActiveIngestionSettings();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="toplama" />
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="font-display text-2xl font-bold">Toplama Ayarları</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Mevcut versiyon: {settings.version}. Kaydetmek yeni bir versiyon açar; eski
            versiyonlar denetim/rollback için durur. Değişiklik bir sonraki <code>pnpm ingest</code>{" "}
            koşusundan itibaren geçerli olur.
          </p>
          <div className="mt-6">
            <IngestionSettingsForm initial={settings} />
          </div>

          <div className="mt-8 rounded-btn border border-hair bg-elevated p-4 text-xs text-ink-secondary">
            <span className="font-semibold text-ink">Sıklık buradan değiştirilemez.</span> Çekimin
            ne zaman çalışacağı iki yerde sabit: <code>apps/worker/src/cron.ts</code>'in{" "}
            <code>CRON_SCHEDULE</code> env&apos;i (lokal/uzun-süren süreç) ve{" "}
            <code>.github/workflows/cron-tick.yml</code>&apos;in cron zamanlaması (şu an her gün
            07:00 ve 19:00, İstanbul). Bunları değiştirmek repo dosyalarını düzenlemeyi gerektirir
            — sahte bir "sıklık" alanı eklemek yerine burada açıkça belirtiyoruz.
          </div>
        </div>
      </div>
    </div>
  );
}
