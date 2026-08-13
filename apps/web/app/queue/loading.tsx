/** Kuyruk normal kaydırılan bir sayfa değil, sabit yükseklikte bir app-shell (Faz 5.5+) —
 *  tek kenar çubuğu (nav + arama/filtre + fırsat listesi + hesap satırı BİRLİKTE) + sağ
 *  detay paneli. Jenerik `PageSkeleton`/`SidebarSkeleton` bu şekli karşılamıyor (iki ayrı
 *  sütun döneminden kalma eski iskelet burada sıçrama yaratırdı) — kendi iskeleti var. */
export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex h-full w-[300px] shrink-0 flex-col border-r border-white/[0.12] px-3 py-4">
        <div className="mb-3 flex shrink-0 items-center gap-2 px-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand to-brand2" />
          <span className="font-display text-sm font-bold tracking-wide text-ink">IDEAFACT</span>
        </div>

        <div className="mb-2 shrink-0 animate-pulse space-y-1">
          <div className="h-9 rounded-btn bg-white/[0.04]" />
          <div className="h-9 rounded-btn bg-white/[0.04]" />
        </div>

        <div className="shrink-0 animate-pulse space-y-2 border-t border-white/[0.12] pt-3">
          <div className="h-8 rounded-btn bg-white/[0.04]" />
        </div>

        <div className="min-h-0 flex-1 animate-pulse space-y-1 overflow-hidden py-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-[52px] rounded-btn bg-white/[0.03]" />
          ))}
        </div>

        <div className="mt-3 flex shrink-0 animate-pulse items-center gap-2 border-t border-white/[0.14] px-1.5 pt-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
          <div className="h-3 flex-1 rounded bg-white/[0.04]" />
          <div className="h-8 w-8 shrink-0 rounded-btn bg-white/[0.04]" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 animate-pulse items-center gap-3 border-b border-white/[0.14] bg-surface px-5 py-3.5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
            <div className="h-3 w-1/3 rounded bg-white/[0.03]" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">
          <div className="mx-auto max-w-3xl animate-pulse space-y-3 rounded-lg border border-white/[0.14] bg-white/[0.035] p-4">
            <div className="h-3 w-1/2 rounded bg-white/[0.04]" />
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.04]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.04]" />
          </div>
        </div>

        <div className="flex shrink-0 animate-pulse items-center gap-2 border-t border-white/[0.14] bg-surface px-5 py-3">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <div className="h-9 w-20 rounded bg-white/[0.04]" />
            <div className="h-9 w-20 rounded bg-white/[0.04]" />
            <div className="h-9 w-20 rounded bg-white/[0.04]" />
            <div className="ml-auto h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  );
}
