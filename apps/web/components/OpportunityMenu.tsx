"use client";

import { useEffect, useRef, useState } from "react";
import { IconCopy, IconExternalLink, IconMoreVertical } from "./icons";

/** Fırsat satırı/başlığı için hızlı aksiyon menüsü — Kuyruk sol navbardaki satırlarda ve
 *  DetailPanel başlığında aynı bileşen. `onSkip` verilmezse "Atla" seçeneği gösterilmez. */
export function OpportunityMenu({
  url,
  onSkip,
  className,
}: {
  url: string;
  onSkip?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function copyLink(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // pano izni yoksa sessiz geç
    }
  }

  return (
    <div ref={ref} onClick={(e) => e.stopPropagation()} className={`relative shrink-0 ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Diğer işlemler"
        aria-label="Diğer işlemler"
        aria-expanded={open}
        className="grid h-6 w-6 place-items-center rounded-btn text-ink-muted transition hover:bg-white/[0.06] hover:text-ink"
      >
        <IconMoreVertical className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 space-y-0.5 rounded-btn border border-hair bg-elevated p-1 text-xs shadow-lg">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-ink-secondary transition hover:bg-white/[0.05] hover:text-ink"
          >
            <IconExternalLink className="h-3.5 w-3.5" /> Yeni sekmede aç
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-ink-secondary transition hover:bg-white/[0.05] hover:text-ink"
          >
            <IconCopy className="h-3.5 w-3.5" /> {copied ? "Kopyalandı ✓" : "Bağlantıyı kopyala"}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={() => {
                onSkip();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-ink-secondary transition hover:bg-white/[0.05] hover:text-ink"
            >
              Atla →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
