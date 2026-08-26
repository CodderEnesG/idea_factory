import { composite, rank } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadDecisions } from "../../lib/load-decisions";
import { loadFinalDecisions } from "../../lib/load-final-decisions";
import { loadComments } from "../../lib/load-comments";
import { loadTasks } from "../../lib/load-tasks";
import { loadDebates } from "../../lib/load-debates";
import { buildCardView, resolveCardBands } from "../../lib/build-card-view";
import { QueueBoard } from "../../components/QueueBoard";
import type { Band } from "../../lib/card-view";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const me = await getSession();
  const meName = me?.username ?? "web";
  const isAdmin = me?.is_admin ?? false;
  const [{ items, demo, error: loadError }, decisions, finalDecisions, comments, tasks, lensRegistry, debateRes] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadFinalDecisions(),
    loadComments(),
    loadTasks(),
    loadLensRegistry(),
    loadDebates(),
  ]);
  const debates = debateRes.map;
  // Sunucu sıralaması AYNI bant çözümünü kullanır (FAZ6_PLAN.md §Faz 2.2). Eskiden burada
  // hiyerarşinin elle yazılmış bir KOPYASI vardı (`final ?? mine ?? debateVerdict`); kapı
  // eklendikten sonra o kopya bekleyen/veto edilmiş sinyalleri pursue bandında sıralamaya
  // devam eder, kart ise İzle/Ele render edilirdi — renk ile sıra çelişirdi.
  const sortBand = new Map<string, Band>();
  for (const item of items) {
    const bands = resolveCardBands({
      comp: composite(item.analyses, lensRegistry),
      mine: decisions.get(item.signal.id)?.find((d) => d.user === meName)?.decision ?? null,
      final: finalDecisions.get(item.signal.id)?.decision ?? null,
      debates: debates.get(item.signal.id) ?? [],
      gateEnabled: !demo,
    });
    sortBand.set(item.signal.id, bands.effectiveBand);
  }
  const cards = rank(items, {
    bandOverride: (item) => sortBand.get(item.signal.id),
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
      !demo, // demo kartlarda tartışma yok — kapı açık olsaydı hepsi "bekliyor" görünürdü
    );
  });

  return (
    <QueueBoard
      items={cards}
      meName={meName}
      me={me}
      demo={demo}
      debatesDegraded={debateRes.degraded}
      loadError={loadError}
    />
  );
}
