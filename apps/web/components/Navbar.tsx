import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import type { SessionUser } from "../lib/session";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

type NavKey = "queue" | "harita" | "trend" | "tez" | "mercekler";

const TAB_ACTIVE = "border-b-2 border-brand py-4 -my-4 text-ink";
const TAB_INACTIVE = "py-4 -my-4 text-ink-secondary hover:text-ink";

export function Navbar({ me, current }: { me: SessionUser | null; current?: NavKey }) {
  const tab = (k: NavKey) => (k === current ? TAB_ACTIVE : TAB_INACTIVE);
  return (
    <div className="sticky top-0 z-10 border-b border-hair bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand to-brand2" />
          <span className="font-display text-sm font-bold tracking-wide text-ink">IDEAFACT</span>
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/queue" className={tab("queue")}>
            Kuyruk
          </Link>
          <Link href="/harita" className={tab("harita")}>
            Harita
          </Link>
          <Link href="/trend" className={tab("trend")}>
            Trend
          </Link>
          {me?.is_admin && (
            <>
              <Link href="/admin/tez" className={tab("tez")}>
                Tez
              </Link>
              <Link href="/admin/mercekler" className={tab("mercekler")}>
                Mercekler
              </Link>
            </>
          )}
        </nav>
        {me && (
          <div className="ml-auto flex items-center gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-[11px] font-bold text-white">
              {initialsOf(me.display_name)}
            </div>
            <span className="hidden text-xs text-ink-secondary sm:inline">{me.display_name}</span>
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
}
