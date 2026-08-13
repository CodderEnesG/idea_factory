"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "./icons";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function out() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* yoksay */
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={out}
      disabled={busy}
      title="Çıkış"
      aria-label="Çıkış"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-btn text-ink-muted transition hover:bg-white/[0.05] hover:text-kill disabled:opacity-50"
    >
      <IconLogout className="h-4 w-4" />
    </button>
  );
}
