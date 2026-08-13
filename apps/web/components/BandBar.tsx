/** Kovala/izle/ele oranını gösteren ince yığılmış çubuk. Segmentler arası 2px boşluk (yüzey rengi). */
export function BandBar({
  pursue,
  watch,
  kill,
  className = "",
}: {
  pursue: number;
  watch: number;
  kill: number;
  className?: string;
}) {
  const total = pursue + watch + kill;
  if (total === 0) {
    return <div className={`h-1.5 rounded-full bg-hair ${className}`} />;
  }
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className={`flex h-1.5 gap-0.5 ${className}`}>
      {pursue > 0 && (
        <div
          className="h-full rounded-full bg-pursue"
          style={{ width: seg(pursue) }}
          title={`${pursue} kovala`}
        />
      )}
      {watch > 0 && (
        <div
          className="h-full rounded-full bg-watch"
          style={{ width: seg(watch) }}
          title={`${watch} izle`}
        />
      )}
      {kill > 0 && (
        <div
          className="h-full rounded-full bg-kill"
          style={{ width: seg(kill) }}
          title={`${kill} ele`}
        />
      )}
    </div>
  );
}

/** Kovala/izle/ele için paylaşılan renk lejandı — birden fazla seri olduğunda daima görünür.
 *  "Karar" — üçlünün ortak adı (Faz 5.4, kullanıcı: "genel adı yok, ad bulalım"). */
export function BandLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-xs text-ink-muted ${className}`}>
      <span className="font-semibold text-ink-muted">Karar:</span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-pursue" /> Kovala
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-watch" /> İzle
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-kill" /> Ele
      </span>
    </div>
  );
}
