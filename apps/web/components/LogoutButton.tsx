"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      className="text-xs text-ink-muted transition hover:text-ink disabled:opacity-50"
    >
      Çıkış
    </button>
  );
}
