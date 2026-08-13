import type { Comment } from "./Comments";
import { fmtCommentDate } from "./Comments";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

/** Yorumları sohbet-mesajı bloğu olarak akışa basar — Kuyruk'un composer düzeni
 *  (`DetailPanel`) için. Giriş kutusu yok, yalnız liste (bkz. `useComments`). */
export function CommentFeed({ items }: { items: Comment[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-elevated font-mono text-[10px] font-bold text-ink-secondary">
            {initialsOf(c.author)}
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-ink">{c.author}</span>
              <span className="font-mono text-[10px] text-ink-muted">{fmtCommentDate(c.created_at)}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
