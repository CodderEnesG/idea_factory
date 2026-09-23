import { composite, rank } from "@idea-factory/core";
import { getSession } from "./auth";
import { loadItems } from "./load-items";
import { loadLensRegistry } from "./load-lens-registry";
import { loadDecisions } from "./load-decisions";
import { loadFinalDecisions } from "./load-final-decisions";
import { loadComments } from "./load-comments";
import { loadTasks } from "./load-tasks";
import { loadDebates } from "./load-debates";
import { buildCardView, resolveCardBands } from "./build-card-view";
import type { Band } from "./card-view";

/**
 * Kuyruk ve Gelen kutusu'nun ortak sunucu tarafı: sinyalleri yükler, tek "etkin bant"
 * hiyerarşisiyle sıralar ve UI'a hazır kartlara çevirir. (Eskiden queue/page.tsx içindeydi.)
 */
export async function loadCards() {
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
  // Sunucu sıralaması kartla AYNI bandı kullanır: kapılı sistem bandı (`gatedBand`). İnsan
  // kararı sırayı değiştirmez (2026-09-14) — bkz. card-view.ts Kuyruk bandı notu.
  const sortBand = new Map<string, Band>();
  for (const item of items) {
    const bands = resolveCardBands({
      comp: composite(item.analyses, lensRegistry),
      mine: decisions.get(item.signal.id)?.find((d) => d.user === meName)?.decision ?? null,
      final: finalDecisions.get(item.signal.id)?.decision ?? null,
      debates: debates.get(item.signal.id) ?? [],
      gateEnabled: !demo,
    });
    sortBand.set(item.signal.id, bands.gatedBand);
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

  return { cards, me, meName, demo, loadError, debatesDegraded: debateRes.degraded };
}
