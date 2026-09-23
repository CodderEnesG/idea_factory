import { composite, rank } from "@idea-factory/core";
import { sharedCtx } from "./context-cache";
import { getSession } from "./auth";
import { loadIndexItems, loadItemsByIds } from "./load-items";
import { loadLensRegistry } from "./load-lens-registry";
import { loadDecisions } from "./load-decisions";
import { loadFinalDecisions } from "./load-final-decisions";
import { loadComments } from "./load-comments";
import { loadTasks } from "./load-tasks";
import { loadDebates } from "./load-debates";
import { buildCardView, resolveCardBands } from "./build-card-view";
import { resolvePanomBand, type Band, type CardView, type GateState } from "./card-view";
import type { Decision, UserDecision } from "../components/DecisionButtons";

/** Bir sinyalin liste satırı için gereken HER ŞEY — tam gerekçe metni yok, o `hydrate` ile gelir. */
export interface Entry {
  id: string;
  title: string;
  source: string;
  sector: string | null;
  market: string | null;
  fit: number;
  gatedBand: Band;
  gate: GateState;
  mine: Decision | null;
  final: Decision | null;
  others: UserDecision[];
  /** Panom'un "ne karar verdik" bandı (kesinleşmiş > benim > başkasının); karar yoksa null. */
  decided: Band | null;
}

type Ctx = Awaited<ReturnType<typeof loadContext>>;

// Yardımcı tablolar (mercek, karar, görev, yorum, tartışma) 30 sn önbellekli; kullanıcı yazma
// rotaları `bustContextCache()` çağırır ki kendi kararın/görevin sayfa geçişinde hemen görünsün.

async function loadContext() {
  const me = await getSession();
  const shared = await sharedCtx.get(async () => {
    const [lensRegistry, decisions, finals, comments, tasks, debateRes] = await Promise.all([
      loadLensRegistry(),
      loadDecisions(),
      loadFinalDecisions(),
      loadComments(),
      loadTasks(),
      loadDebates(),
    ]);
    return { lensRegistry, decisions, finals, comments, tasks, debates: debateRes.map, debatesDegraded: debateRes.degraded };
  });
  return {
    me,
    meName: me?.username ?? "web",
    isAdmin: me?.is_admin ?? false,
    ...shared,
  };
}

export interface Workspace extends Ctx {
  entries: Entry[];
  demo: boolean;
  loadError: string | null;
}

/**
 * Üç ekranın (Gelen kutusu, Tüm sinyaller, Panom) ortak sunucu tarafı. Hafif indeksten sıralı
 * `Entry` listesi üretir (sistemin kapılı bandı sıralar — insan kararı sırayı değiştirmez,
 * bkz. card-view.ts); ekranda gösterilecek kartlar `hydrate` ile ayrıca, yalnız o kadarı çekilir.
 */
export async function loadWorkspace(): Promise<Workspace> {
  const [ctx, index] = await Promise.all([loadContext(), loadIndexItems()]);
  const { items, demo, error } = index;
  const { lensRegistry, decisions, finals, debates, meName } = ctx;

  const bandOf = new Map<string, { band: Band; gate: GateState }>();
  for (const item of items) {
    const id = item.signal.id;
    const b = resolveCardBands({
      comp: composite(item.analyses, lensRegistry),
      mine: decisions.get(id)?.find((d) => d.user === meName)?.decision ?? null,
      final: finals.get(id)?.decision ?? null,
      debates: debates.get(id) ?? [],
      gateEnabled: !demo,
    });
    bandOf.set(id, { band: b.gatedBand, gate: b.gate });
  }

  const ranked = rank(items, { bandOverride: (i) => bandOf.get(i.signal.id)?.band, lensRegistry });
  const entries: Entry[] = ranked.map((item) => {
    const id = item.signal.id;
    const dec = decisions.get(id) ?? [];
    const mine = dec.find((d) => d.user === meName)?.decision ?? null;
    const others = dec.filter((d) => d.user !== meName);
    const final = finals.get(id)?.decision ?? null;
    const b = bandOf.get(id)!;
    return {
      id,
      title: item.signal.title,
      source: item.signal.source,
      sector: item.signal.sector ?? null,
      market: item.signal.market ?? null,
      fit: composite(item.analyses, lensRegistry).fit,
      gatedBand: b.band,
      gate: b.gate,
      mine,
      final,
      others,
      decided: resolvePanomBand(mine, final, others[0]?.decision ?? null),
    };
  });

  return { ...ctx, entries, demo, loadError: error };
}

/** Verilen sinyallerin tam kart görünümü (yalnız bunlar DB'den çekilir); sıra `ids` sırasıdır. */
export async function hydrate(ws: Workspace, ids: string[]): Promise<CardView[]> {
  if (ids.length === 0) return [];
  const items = await loadItemsByIds(ids);
  return items.map((item) => {
    const id = item.signal.id;
    const dec = ws.decisions.get(id) ?? [];
    return buildCardView(
      item,
      dec.find((d) => d.user === ws.meName)?.decision ?? null,
      dec.filter((d) => d.user !== ws.meName),
      ws.comments.get(id) ?? [],
      ws.tasks.get(id) ?? [],
      ws.lensRegistry,
      ws.isAdmin,
      ws.debates.get(id) ?? [],
      ws.finals.get(id) ?? null,
      !ws.demo, // demo kartlarda tartışma yok — kapı açık olsaydı hepsi "bekliyor" görünürdü
    );
  });
}
