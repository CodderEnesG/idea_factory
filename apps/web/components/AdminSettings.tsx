"use client";

import { useState, type ReactNode } from "react";
import { IconFileText, IconAperture, IconDownload, IconBarChart } from "./icons";

export type AdminTabKey = "tez" | "mercekler" | "toplama" | "metrikler";

const TABS: { key: AdminTabKey; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { key: "tez", label: "Tez", icon: IconFileText },
  { key: "mercekler", label: "Mercekler", icon: IconAperture },
  { key: "toplama", label: "Toplama", icon: IconDownload },
  { key: "metrikler", label: "Metrikler", icon: IconBarChart },
];

/**
 * Ayarlar (backlog #9): önceden dört ayrı sayfa (/admin/tez, /admin/mercekler, /admin/toplama,
 * /admin/metrikler) — ChatGPT/Gemini/Claude ayarlar deseni gibi TEK sayfada sekmeler halinde
 * birleştirildi. Sekme içerikleri server component'te (app/admin/page.tsx) önceden hazırlanıp
 * children olarak geçiliyor — sekme geçişi tamamen istemci tarafı (yeniden fetch/navigasyon
 * yok), URL yalnız kozmetik olarak (History API ile, Next router'ı tetiklemeden) güncellenir.
 */
export function AdminSettings({
  initialTab,
  tez,
  mercekler,
  toplama,
  metrikler,
}: {
  initialTab: AdminTabKey;
  tez: ReactNode;
  mercekler: ReactNode;
  toplama: ReactNode;
  metrikler: ReactNode;
}) {
  const [active, setActive] = useState<AdminTabKey>(initialTab);
  const content: Record<AdminTabKey, ReactNode> = { tez, mercekler, toplama, metrikler };

  function selectTab(key: AdminTabKey) {
    setActive(key);
    window.history.replaceState(null, "", `/admin?tab=${key}`);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pt-16 pb-10 md:flex-row md:gap-8 md:pt-10">
      <nav className="md:w-44 md:shrink-0">
        <h1 className="mb-4 px-2.5 font-display text-lg font-bold text-ink">Ayarlar</h1>
        <div className="flex gap-0.5 overflow-x-auto md:flex-col md:space-y-0.5 md:overflow-visible">
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectTab(t.key)}
                aria-current={isActive}
                className={`flex shrink-0 items-center gap-2.5 rounded-btn px-2.5 py-2 text-left text-sm transition md:w-full ${
                  isActive ? "bg-white/[0.06] text-ink" : "text-ink-secondary hover:bg-white/[0.03] hover:text-ink"
                }`}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="min-w-0 flex-1">{content[active]}</div>
    </div>
  );
}
