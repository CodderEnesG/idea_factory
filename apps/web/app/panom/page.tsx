import { rank } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadDecisions } from "../../lib/load-decisions";
import { loadComments } from "../../lib/load-comments";
import { loadTasks } from "../../lib/load-tasks";
import { loadDebates } from "../../lib/load-debates";
import { buildCardView } from "../../lib/build-card-view";
import { PanomBoard } from "../../components/PanomBoard";
import type { Decision } from "../../components/DecisionButtons";
import type { CardView } from "../../lib/card-view";

export const dynamic = "force-dynamic";

/**
 * Panom (Faz 5.1): Kuyruk'ta karar verdiğiniz sinyaller buraya taşınır ve klasör gibi
 * Kovala/İzle/Ele'ye ayrılır — kararsız sinyaller bu sayfada hiç görünmez. Kuyruk'un
 * arama/filtre/sonsuz-liste mantığı bilinçli olarak yok: Kuyruk = keşif, Panom = zaten
 * karar verilmiş olanı yönetme (bkz. PLAN.md §12). Arama/facet filtreleri (backlog #7)
 * `PanomBoard`'da (client) — bu sayfa yalnız veriyi toplayıp devrediyor.
 */
export default async function PanomPage() {
  const me = await getSession();
  const meName = me?.username ?? "web";
  const [{ items }, decisions, comments, tasks, lensRegistry] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadComments(),
    loadTasks(meName),
    loadLensRegistry(),
  ]);
  const isAdmin = me?.is_admin ?? false;
  const debates = await loadDebates(isAdmin);

  const cards = rank(items, { lensRegistry })
    .map((item) => {
      const dec = decisions.get(item.signal.id) ?? [];
      const mine = dec.find((d) => d.user === meName)?.decision ?? null;
      const others = dec.filter((d) => d.user !== meName);
      return buildCardView(
        item,
        mine,
        others,
        comments.get(item.signal.id) ?? [],
        tasks.get(item.signal.id) ?? [],
        lensRegistry,
        isAdmin,
        debates.get(item.signal.id) ?? [],
      );
    })
    .filter((c): c is CardView & { mine: Decision } => c.mine !== null);

  return <PanomBoard cards={cards} me={me} />;
}
