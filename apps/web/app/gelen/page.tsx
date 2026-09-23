import { loadCards } from "../../lib/load-cards";
import { InboxBoard } from "../../components/InboxBoard";

export const dynamic = "force-dynamic";

/** Karar bekleyen en iyi fırsat sayısı: ekranı boğmadan "bu hafta bakılacaklar". */
const INBOX_LIMIT = 25;

export default async function Gelen() {
  const { cards, me, demo, loadError } = await loadCards();

  // Filtre değil sıralama: zaten `rank` bandı+uyumu sıraladı. Burada yalnız "bana ait olmayan"
  // (karar verilmemiş) ve sistemin elediği ayrılır; elenenler sayaçta kalır, silinmez.
  const undecided = cards.filter((c) => c.mine === null && c.finalDecision === null);
  const open = undecided.filter((c) => c.gatedBand !== "kill");

  return (
    <InboxBoard
      items={open.slice(0, INBOX_LIMIT)}
      hiddenKilled={undecided.length - open.length}
      decidedCount={cards.length - undecided.length}
      me={me}
      demo={demo}
      loadError={loadError}
    />
  );
}
