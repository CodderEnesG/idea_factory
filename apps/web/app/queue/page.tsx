import { rank } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadDecisions } from "../../lib/load-decisions";
import { loadFinalDecisions } from "../../lib/load-final-decisions";
import { loadComments } from "../../lib/load-comments";
import { loadTasks } from "../../lib/load-tasks";
import { loadDebates } from "../../lib/load-debates";
import { buildCardView } from "../../lib/build-card-view";
import { QueueBoard } from "../../components/QueueBoard";
import type { Decision } from "../../components/DecisionButtons";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const me = await getSession();
  const meName = me?.username ?? "web";
  const [{ items, demo }, decisions, finalDecisions, comments, tasks, lensRegistry] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadFinalDecisions(),
    loadComments(),
    loadTasks(meName),
    loadLensRegistry(),
  ]);
  const isAdmin = me?.is_admin ?? false;
  const debates = await loadDebates(isAdmin);
  // Geri-besleme döngüsü (PLAN.md §10): kesinleşmiş karar (varsa) > kendi kararım > AI bandı.
  // Kesinleşmiş "resmi" karar en yüksek önceliğe sahip — problem 1/2 ("netice belirlenmiyor,
  // fırsat ayırt edilemiyor"): ekip artık AI'ın önerisi yerine gerçekten karara varılanı görür.
  const myBand = new Map<string, Decision>();
  for (const item of items) {
    const final = finalDecisions.get(item.signal.id)?.decision;
    const mine = decisions.get(item.signal.id)?.find((d) => d.user === meName)?.decision;
    const band = final ?? mine;
    if (band) myBand.set(item.signal.id, band);
  }
  const cards = rank(items, {
    bandOverride: (item) => myBand.get(item.signal.id),
    lensRegistry,
  }).map((item) => {
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
      finalDecisions.get(item.signal.id) ?? null,
    );
  });

  return <QueueBoard items={cards} meName={meName} me={me} demo={demo} />;
}
