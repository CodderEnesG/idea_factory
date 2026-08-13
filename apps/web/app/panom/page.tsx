import { rank } from "@idea-factory/core";
import { getSession } from "../../lib/auth";
import { loadItems } from "../../lib/load-items";
import { loadLensRegistry } from "../../lib/load-lens-registry";
import { loadDecisions } from "../../lib/load-decisions";
import { loadComments } from "../../lib/load-comments";
import { loadTasks } from "../../lib/load-tasks";
import { loadDebates } from "../../lib/load-debates";
import { buildCardView } from "../../lib/build-card-view";
import { AppSidebar } from "../../components/AppSidebar";
import { PanomCard } from "../../components/PanomCard";
import type { Decision } from "../../components/DecisionButtons";
import type { CardView } from "../../lib/card-view";

export const dynamic = "force-dynamic";

const GROUPS: { d: Decision; label: string; dot: string; text: string }[] = [
  { d: "pursue", label: "Kovala", dot: "bg-pursue", text: "text-pursue" },
  { d: "watch", label: "İzle", dot: "bg-watch", text: "text-watch" },
  { d: "kill", label: "Ele", dot: "bg-kill", text: "text-kill" },
];

/**
 * Panom (Faz 5.1): Kuyruk'ta karar verdiğiniz sinyaller buraya taşınır ve klasör gibi
 * Kovala/İzle/Ele'ye ayrılır — kararsız sinyaller bu sayfada hiç görünmez. Kuyruk'un
 * arama/filtre/sonsuz-liste mantığı bilinçli olarak yok: Kuyruk = keşif, Panom = zaten
 * karar verilmiş olanı yönetme (bkz. PLAN.md §12).
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

  const byBand = new Map<Decision, (CardView & { mine: Decision })[]>();
  for (const g of GROUPS) byBand.set(g.d, []);
  for (const c of cards) byBand.get(c.mine)?.push(c);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar me={me} current="panom" />
      <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold">Panom</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {cards.length} karar verilmiş sinyal · AI ne dedi, sen ne dedin, sırada ne var
          </p>
        </header>

        {cards.length === 0 && (
          <p className="text-sm text-ink-muted">
            Henüz bir karar vermediniz. Kuyruk&apos;ta bir sinyale Kovala, İzle ya da Ele deyin —
            burada kendi klasörüne düşsün.
          </p>
        )}

        <div className="space-y-10">
          {GROUPS.map((g) => {
            const list = byBand.get(g.d) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={g.d}>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${g.dot}`} />
                  <h2 className={`font-display text-lg font-semibold ${g.text}`}>{g.label}</h2>
                  <span className="text-sm text-ink-muted">({list.length})</span>
                </div>
                <div className="space-y-4">
                  {list.map((item) => (
                    <PanomCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
      </main>
    </div>
  );
}
