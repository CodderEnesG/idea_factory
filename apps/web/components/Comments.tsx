"use client";

import { useEffect, useState } from "react";

export interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

export function fmtCommentDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/** Yorum verisi + ekleme mantığı — hem tam `Comments` bileşeni hem de Kuyruk'un ayrı
 *  akış/composer düzeni (`DetailPanel`) bunu paylaşır. */
export function useComments(signalId: string, initial: Comment[] = []) {
  const [items, setItems] = useState<Comment[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  // Bug: `useState(initial)` yalnız İLK mount'ta state'e giriyor. `DetailPanel` gibi Kuyruk'ta
  // sinyal değişince yeniden mount OLMAYAN (yalnız `item` prop'u değişen) kalıcı bileşenlerde
  // bu, her sinyalde bir öncekinin yorumlarının görünmesi anlamına geliyordu — kullanıcı
  // bildirdi ("her sayfada aynı yorum gözüküyor"). `signalId` değişince state'i tazeliyoruz;
  // kasıtlı olarak yalnız `signalId`'ye bağlı — `initial`'ı dependency'e koymak, üst bileşen
  // aynı sinyal için yeni bir array referansı ürettiğinde az önce eklenen lokal yorumu silerdi.
  useEffect(() => {
    setItems(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalId]);

  async function add() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, body }),
      });
      const j = (await res.json().catch(() => null)) as { comment?: Comment } | null;
      if (j?.comment) {
        setItems((p) => [...p, j.comment as Comment]);
        setText("");
      }
    } catch {
      /* demo/hata: sessiz */
    } finally {
      setBusy(false);
    }
  }

  return { items, text, setText, add, busy };
}

/** Sade liste görünümü (mesaj-balonu yok) — Panom'un "Detaylar" bölümünde kullanılıyor. */
export function CommentList({ items }: { items: Comment[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2">
      {items.map((c) => (
        <li key={c.id} className="text-xs">
          <span className="text-ink">{c.author}</span>
          <span className="text-ink-muted"> · {fmtCommentDate(c.created_at)}</span>
          <div className="mt-0.5 whitespace-pre-wrap text-ink-secondary">{c.body}</div>
        </li>
      ))}
    </ul>
  );
}

/** Kendi kendine yeten liste+giriş — Panom kartlarında kullanılıyor. Kuyruk'un
 *  sohbet-akışı düzeni (`DetailPanel`) bunun yerine `useComments` + `CommentFeed`'i
 *  ayrı ayrı kullanıyor (giriş kutusu composer'da, liste akışta). */
export function Comments({ signalId, initial = [] }: { signalId: string; initial?: Comment[] }) {
  const { items, text, setText, add, busy } = useComments(signalId, initial);
  return (
    <div className="mt-4 border-t border-hair pt-3">
      <div className="text-xs font-medium text-ink-secondary">Yorumlar ({items.length})</div>
      <CommentList items={items} />
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Yorum ekle…"
          className="flex-1 rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <button
          onClick={add}
          disabled={busy || !text.trim()}
          className="rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
