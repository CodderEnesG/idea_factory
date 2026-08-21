/** Gezinme sırasında "tıkla, hiçbir şey olmadan bekle" hissini kırmak için — App Router
 *  `loading.tsx` bunu anında (RSC verisi gelmeden) gösterir. Kenar çubuğu burada sahte/statik:
 *  oturum verisi henüz yok, aynı genişlikte bir iskelet göstererek layout sıçramasını önlüyoruz.
 *  Gerçek AppSidebar'la aynı şekil (Faz 5.9): 300px, büyük logo + daralt ikonu, Kuyruk/Panom
 *  ikon+metin satırları, alt hesap satırı (avatar + ayarlar + çıkış ikonu). */
export function SidebarSkeleton() {
  return (
    <div className="hidden h-full w-[300px] shrink-0 flex-col border-r border-white/[0.12] px-3 py-4 md:flex">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-1 px-1.5">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full bg-gradient-to-br from-brand to-brand2" />
          <span className="font-display text-base font-bold tracking-wide text-ink">IDEAFACT</span>
        </div>
        <div className="h-6 w-6 rounded-btn bg-white/[0.03]" />
      </div>
      <div className="animate-pulse space-y-1">
        <div className="h-9 rounded-btn bg-white/[0.04]" />
        <div className="h-9 rounded-btn bg-white/[0.04]" />
      </div>
      <div className="min-h-0 flex-1" />
      <div className="mt-3 flex shrink-0 animate-pulse items-center gap-2 border-t border-white/[0.14] px-1.5 pt-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
        <div className="h-3 flex-1 rounded bg-white/[0.04]" />
        <div className="h-8 w-8 shrink-0 rounded-btn bg-white/[0.04]" />
        <div className="h-8 w-8 shrink-0 rounded-btn bg-white/[0.04]" />
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarSkeleton />
      <main className="min-w-0 flex-1 overflow-hidden px-6 pt-16 pb-8 md:pt-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-btn bg-white/[0.06]" />
          <div className="h-4 w-72 rounded-btn bg-white/[0.04]" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="glass h-24 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
