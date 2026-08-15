"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlertTriangle,
  IconSearch,
  IconTrendingUp,
  IconUsers,
} from "../../components/icons";

const FEATURES = [
  { icon: IconTrendingUp, text: "Yüzlerce sinyal, tezine göre tek gerekçeli sıralama" },
  { icon: IconUsers, text: "AI analiziyle karar, ekip yorumuyla doğrulama" },
  { icon: IconSearch, text: "Her fırsatta kanıt ve doğrulama görevi bir tık uzakta" },
];

/** SaaS-standart iki panelli giriş ekranı: solda marka/değer önerisi (küçük ekranda gizli),
 *  sağda form. Marka paneli `globals.css`'teki glow-backdrop + starfield katmanları üstüne
 *  kurulu — ikisi aynı elemana binmiyor (background-image çakışması), ayrı katmanlar. */
export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setErr("bağlantı hatası — internetini kontrol edip tekrar dene");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden overflow-hidden border-r border-hair lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:px-12 lg:py-12">
        <div className="glow-backdrop absolute inset-0" />
        <div className="starfield absolute inset-0 opacity-70" />

        <div className="relative z-10 flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand2 font-display text-sm font-bold text-white shadow-brand">
            IF
          </span>
          <span className="font-display text-base font-bold tracking-wide text-ink">IDEAFACT</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink">
            Tez-odaklı pazar istihbaratı
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
            Sinyal içeri → tezine göre sıralı, gerekçeli, sorgulanabilir fırsatlar dışarı.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hair bg-white/[0.04] text-brand">
                  <f.icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm leading-relaxed text-ink-secondary">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-ink-muted">Dahili ekip aracı · davetle erişim</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand2 font-display text-sm font-bold text-white">
            IF
          </span>
          <span className="font-display text-base font-bold tracking-wide text-ink">IDEAFACT</span>
        </div>

        <div className="w-full max-w-sm rounded-card border border-hair bg-elevated/70 p-8 shadow-glow backdrop-blur-xl">
          <h2 className="font-display text-xl font-bold text-ink">Tekrar hoş geldin</h2>
          <p className="mt-1 text-sm text-ink-secondary">Ekibinin fırsat kuyruğuna eriş.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-secondary">
                Kullanıcı adı
              </label>
              <div className="flex items-center rounded-btn border border-hair bg-surface transition focus-within:border-strong">
                <span className="pl-3 text-ink-muted">
                  <IconUser className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanıcı adın"
                  autoComplete="username"
                  autoFocus
                  className="w-full min-w-0 bg-transparent px-2.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-secondary">
                Parola
              </label>
              <div className="flex items-center rounded-btn border border-hair bg-surface transition focus-within:border-strong">
                <span className="pl-3 text-ink-muted">
                  <IconLock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full min-w-0 bg-transparent px-2.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}
                  title={showPassword ? "Parolayı gizle" : "Parolayı göster"}
                  className="px-3 text-ink-muted transition hover:text-ink"
                >
                  {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 rounded-btn border border-kill/40 bg-kill/10 px-3 py-2.5 text-xs text-kill">
                <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username || !password}
              className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Giriş yap"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Hesabın yoksa yöneticinle iletişime geç.
          </p>
        </div>
      </div>
    </main>
  );
}
