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
import { PanomBoard } from "../../components/PanomBoard";

export const dynamic = "force-dynamic";

/**
 * Panom (Faz 5.1, 0013'te kanban'a yeniden yazıldı): kararı olan sinyaller buraya taşınır.
 * "Kararı olan" artık İKİ yoldan biri: (a) BEN karar verdim, (b) biri kilitleyip
 * KESİNLEŞTİRDİ — ikincisi olmadan ekip kararları görünmezdi (problem 1/2). Kuyruk'un
 * arama/filtre/sonsuz-liste mantığı bilinçli olarak yok: Kuyruk = keşif, Panom = zaten
 * karar verilmiş olanı yönetme (bkz. PLAN.md §12). Gruplama (`PanomBoard`, client) artık
 * final varsa final'e, yoksa `mine`'a göre — kart iki alanı da taşıyor.
 */
export default async function PanomPage() {
  const me = await getSession();
  const meName = me?.username ?? "web";
  const isAdmin = me?.is_admin ?? false;
  // loadDebates yalnız isAdmin'e bağlı (session zaten çözüldü) — eskiden Promise.all'dan
  // SONRA ayrı bir await'ti, sayfanın kritik yoluna gereksiz bir tam round-trip ekliyordu.
  const [{ items }, decisions, finalDecisions, comments, tasks, lensRegistry, debates] = await Promise.all([
    loadItems(),
    loadDecisions(),
    loadFinalDecisions(),
    loadComments(),
    loadTasks(meName),
    loadLensRegistry(),
    loadDebates(isAdmin),
  ]);

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
        finalDecisions.get(item.signal.id) ?? null,
      );
    })
    // Panom eskiden yalnız BEN karar verdiysem ya da kilitliyse gösteriyordu — başka bir
    // üyenin (ör. eski "web" varsayılan hesabı, ya da takım arkadaşı) verdiği karar hiç
    // görünmüyordu (2026-08-24 kullanıcı bulgusu). Artık `c.others.length > 0` da sayılır;
    // hangi kararın gösterileceği (final > mine > en son başkasınınki) PanomBoard'da çözülür.
    .filter((c) => c.mine !== null || c.finalDecision !== null || c.others.length > 0);

  return <PanomBoard cards={cards} me={me} meName={meName} />;
}
