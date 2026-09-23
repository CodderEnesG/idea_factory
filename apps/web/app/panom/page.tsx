import { loadWorkspace, hydrate } from "../../lib/workspace";
import { PanomBoard } from "../../components/PanomBoard";

export const dynamic = "force-dynamic";

/**
 * Panom: karar verilmiş sinyallerin sade takibi. Kovala/İzle kartları tam çekilir (görev listesi
 * ve analiz için); Ele yalnız başlık listesidir. "Karar verilmiş" = ekip kararı VEYA benim kararım
 * VEYA başka bir üyenin kararı (resolvePanomBand) — hepsi Panom'da görünür.
 */
export default async function PanomPage() {
  const ws = await loadWorkspace();
  const decided = ws.entries.filter((e) => e.decided !== null);
  const active = decided.filter((e) => e.decided !== "kill");
  const cards = await hydrate(
    ws,
    active.map((e) => e.id),
  );
  const killed = decided
    .filter((e) => e.decided === "kill")
    .map((e) => ({ id: e.id, title: e.title, source: e.source }));

  return <PanomBoard cards={cards} killed={killed} me={ws.me} meName={ws.meName} />;
}
