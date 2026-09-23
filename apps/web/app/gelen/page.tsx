import { loadWorkspace, hydrate } from "../../lib/workspace";
import { InboxBoard } from "../../components/InboxBoard";

export const dynamic = "force-dynamic";

/** Karar bekleyen en iyi fırsat sayısı: ekranı boğmadan "bu hafta bakılacaklar". */
const INBOX_LIMIT = 25;

export default async function Gelen() {
  const ws = await loadWorkspace();

  // Filtre değil sıralama: `entries` zaten bant+güven+uyuma göre sıralı. Burada yalnız "bana ait
  // olmayan" (karar verilmemiş) ve sistemin elediği ayrılır; elenenler sayaçta kalır, silinmez.
  const undecided = ws.entries.filter((e) => e.mine === null && e.final === null);
  const open = undecided.filter((e) => e.gatedBand !== "kill");
  const cards = await hydrate(ws, open.slice(0, INBOX_LIMIT).map((e) => e.id));

  return (
    <InboxBoard
      items={cards}
      hiddenKilled={undecided.length - open.length}
      decidedCount={ws.entries.length - undecided.length}
      me={ws.me}
      demo={ws.demo}
      loadError={ws.loadError}
    />
  );
}
