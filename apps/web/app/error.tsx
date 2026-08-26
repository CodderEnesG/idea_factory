"use client";

/**
 * Sayfa düzeyinde hata sınırı (FAZ6_PLAN.md §Faz 3). Bugüne kadar uygulamada HİÇ `error.tsx`
 * yoktu: bir sunucu bileşeni fırlattığında Next'in İngilizce "Application error: a server-side
 * exception has occurred" ekranı çıkıyordu — yeniden dene düğmesi yok, Türkçe metin yok.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-ink">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Sayfa yüklenirken bir hata oluştu. Verilerin etkilenmedi — kararların ve görevlerin
          yerinde duruyor.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-muted">hata kodu: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-btn border border-strong bg-elevated px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}
