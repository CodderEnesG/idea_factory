import { loadCards } from "../../lib/load-cards";
import { QueueBoard } from "../../components/QueueBoard";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const { cards, me, meName, demo, loadError, debatesDegraded } = await loadCards();

  return (
    <QueueBoard
      items={cards}
      meName={meName}
      me={me}
      demo={demo}
      debatesDegraded={debatesDegraded}
      loadError={loadError}
    />
  );
}
