import type { CardView } from "../lib/card-view";
import { BAND } from "./card-visuals";
import { formatSource } from "../lib/source-labels";
import { OpportunityMenu } from "./OpportunityMenu";
import { IconAward } from "./icons";

const BORDER_BY_BAND: Record<CardView["band"], string> = {
  pursue: "border-l-pursue",
  watch: "border-l-watch",
  kill: "border-l-kill",
};

/** Kuyruk'un sol paneli: taranabilir kompakt satır — puan + başlık + kaynak, detay yok
 *  (detay sağ panelde). Tıklayınca sağ paneli değiştirir, sayfa yenilenmez. */
export function QueueRow({
  item,
  selected,
  onSelect,
}: {
  item: CardView;
  selected: boolean;
  onSelect: () => void;
}) {
  const band = BAND[item.band];
  return (
    // `role="button"` (native <button> değil): satırın sonunda ayrı bir gerçek <button>
    // (OpportunityMenu) barındırıyor — buton içine buton HTML'de geçersiz/erişilebilirlik
    // sorunu yaratır.
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex w-full cursor-pointer items-center gap-2 border-l-[3px] px-3 py-2 text-left text-[13px] transition ${
        selected ? `${BORDER_BY_BAND[item.band]} bg-white/[0.05]` : "border-l-transparent hover:bg-white/[0.025]"
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${band.dot}`} />
      <span className="w-6 shrink-0 text-right font-mono text-xs font-bold text-ink-muted">
        {item.fit}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-ink">{item.title}</div>
        <div className="truncate font-mono text-[10.5px] text-ink-muted">
          {formatSource(item.source)}
          {item.sector && ` · ${item.sector}`}
        </div>
      </div>
      {item.mine !== null && <span className="shrink-0 text-[10px] text-ink-muted">✓</span>}
      {item.bench && <IconAward className="h-3 w-3 shrink-0 text-ink-muted" />}
      <OpportunityMenu url={item.url} />
    </div>
  );
}
