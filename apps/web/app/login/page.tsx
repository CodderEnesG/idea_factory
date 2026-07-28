"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const next = new URLSearchParams(window.location.search).get("next") || "/queue";
        router.push(next);
        router.refresh();
      } else {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setErr(j?.error ?? "giriş başarısız");
        setBusy(false);
      }
    } catch {
      setErr("bağlantı hatası");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl font-bold text-ink">Idea Factory</h1>
      <p className="mt-1 text-sm text-ink-secondary">Ekip incelemesi — giriş yap.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="kullanıcı adı"
          autoComplete="username"
          className="w-full rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="parola"
          autoComplete="current-password"
          className="w-full rounded-btn border border-hair bg-elevated px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
        />
        {err && <p className="text-sm text-kill">{err}</p>}
        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full rounded-btn border border-strong bg-elevated px-3 py-2 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {busy ? "…" : "Giriş"}
        </button>
      </form>
    </main>
  );
}
