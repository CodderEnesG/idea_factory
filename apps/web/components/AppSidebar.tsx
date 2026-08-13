"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import {
  IconInbox,
  IconBookmark,
  IconChevronLeft,
  IconChevronDown,
  IconSliders,
  IconGlobe,
  IconTrendingUp,
  IconMessage,
  IconFileText,
  IconAperture,
  IconDownload,
  IconBarChart,
} from "./icons";
import type { SessionUser } from "../lib/session";

const EXPANDED_WIDTH = 300;
const COLLAPSED_WIDTH = 64;
const COLLAPSE_KEY = "idea-factory:sidebar-collapsed";
const MORE_OPEN_KEY = "idea-factory:sidebar-more-open";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}

export type NavKey =
  | "queue"
  | "panom"
  | "harita"
  | "trend"
  | "digest"
  | "tez"
  | "mercekler"
  | "toplama"
  | "metrikler";

const REPORT_KEYS: NavKey[] = ["harita", "trend", "digest"];
const ADMIN_KEYS: NavKey[] = ["tez", "mercekler", "toplama", "metrikler"];

const ITEM_ACTIVE = "bg-white/[0.06] text-ink";
const ITEM_INACTIVE = "text-ink-secondary hover:bg-white/[0.03] hover:text-ink";

function NavItem({
  href,
  active,
  icon,
  collapsed,
  label,
  children,
}: {
  href: string;
  active: boolean;
  icon?: React.ReactNode;
  collapsed?: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-btn text-sm transition ${
        icon ? (collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-3 py-2") : "px-2.5 py-1.5"
      } ${active ? ITEM_ACTIVE : ITEM_INACTIVE}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {!collapsed && children}
    </Link>
  );
}

/**
 * Uygulama-geneli sol kenar çubuğu (Faz 5.5–5.11) — üst yatay navbar tamamen kaldırıldı.
 * ChatGPT/Claude/Gemini deseni: gezinme + hesap bilgisi TEK kenar çubuğunda, ana alan
 * baştan sona kendi.
 *
 * Faz 5.9: kullanıcı isteği — genişlik tüm sayfalarda aynı (EXPANDED_WIDTH, tek sabit),
 * artık her çağıran ayrı `width` geçmiyor; küçült/büyüt anahtarı (logo satırının sağında)
 * COLLAPSED_WIDTH'e (yalnız ikon) daralan bir rayla değiştiriyor — tercih localStorage'ta
 * kalıcı (sayfa geçişlerinde AppSidebar yeniden mount oluyor, ortak bir layout.tsx yok).
 * Daraltılmışken `children` (Kuyruk'un liste/arama alanı) render edilmiyor — 64px'te
 * anlamlı bir liste gösterilemez, kullanıcı sağ paneli odaklamak için daraltıyor demektir.
 *
 * Faz 5.10/5.11: Raporlar (Harita/Trend/Digest) Kuyruk/Panom'un hemen altında, kendi
 * ikonlarıyla, katlanır-açılır ("Daha fazla") bir bölüm — varsayılan kapalı, tercih
 * localStorage'ta kalıcı, yalnız o an bir Raporlar sayfasındaysak açık başlar. Ayarlar
 * (admin-only: Tez/Mercekler/Toplama/Metrikler) kullanıcı isteğiyle ESKİ mantığa
 * döndürüldü (Faz 5.8 deseni): hesap satırında, Çıkış'ın SOLUNDA duran bir dişli ikon
 * → tıklanınca hesap satırının ÜSTÜNDE yüzen bir panel açılıyor, dışına tıklayınca kapanır.
 */
export function AppSidebar({
  me,
  current,
  children,
}: {
  me: SessionUser | null;
  current?: NavKey;
  children?: ReactNode;
}) {
  const [moreOpen, setMoreOpen] = useState(current ? REPORT_KEYS.includes(current) : false);
  const [adminOpen, setAdminOpen] = useState(current ? ADMIN_KEYS.includes(current) : false);
  const [collapsed, setCollapsed] = useState(false);
  const adminWrapRef = useRef<HTMLDivElement>(null);
  const active = (k: NavKey) => k === current;

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    const storedMore = window.localStorage.getItem(MORE_OPEN_KEY) === "1";
    if (storedMore) setMoreOpen(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      if (next) setAdminOpen(false);
      return next;
    });
  }

  function toggleMore() {
    setMoreOpen((v) => {
      const next = !v;
      window.localStorage.setItem(MORE_OPEN_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Ayarlar paneli (eski mantık): dışına tıklayınca kapanır — Faz 5.8'deki gear-popup'la
  // birebir aynı davranış.
  useEffect(() => {
    if (!adminOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (adminWrapRef.current && !adminWrapRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [adminOpen]);

  return (
    <div
      className="flex h-full shrink-0 flex-col border-r border-white/[0.12] bg-surface px-3 py-4 transition-[width] duration-150"
      style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
    >
      <div
        className={`mb-3 flex shrink-0 items-center gap-1 px-1.5 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded-full bg-gradient-to-br from-brand to-brand2" />
          {!collapsed && (
            <span className="truncate font-display text-base font-bold tracking-wide text-ink">IDEAFACT</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Kenar çubuğunu daralt"
            aria-label="Kenar çubuğunu daralt"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-btn text-ink-muted transition hover:bg-white/[0.05] hover:text-ink"
          >
            <IconChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={toggleCollapsed}
          title="Kenar çubuğunu genişlet"
          aria-label="Kenar çubuğunu genişlet"
          className="mb-2 grid h-6 w-6 shrink-0 place-items-center self-center rounded-btn text-ink-muted transition hover:bg-white/[0.05] hover:text-ink"
        >
          <IconChevronLeft className="h-3.5 w-3.5 rotate-180" />
        </button>
      )}

      <nav className="mb-2 shrink-0 space-y-1">
        <NavItem href="/queue" active={active("queue")} icon={<IconInbox className="h-4 w-4" />} collapsed={collapsed} label="Kuyruk">
          Kuyruk
        </NavItem>
        {me && (
          <NavItem
            href="/panom"
            active={active("panom")}
            icon={<IconBookmark className="h-4 w-4" />}
            collapsed={collapsed}
            label="Panom"
          >
            Panom
          </NavItem>
        )}

        {!collapsed && (
          <button
            onClick={toggleMore}
            aria-expanded={moreOpen}
            className={`flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-sm transition ${
              moreOpen || (current && REPORT_KEYS.includes(current))
                ? "text-ink"
                : "text-ink-muted hover:bg-white/[0.03] hover:text-ink"
            }`}
          >
            <IconChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            <span className="flex-1 text-left">Daha fazla</span>
          </button>
        )}

        {/* Daraltılmış rayda (64px) "Daha fazla" katlanır-açılır kavramının anlamı yok —
            metin zaten hiç gösterilmiyor, o yüzden Raporlar ikonları Kuyruk/Panom gibi
            doğrudan (her zaman) gösteriliyor; yalnız genişken açılır/kapanır. */}
        {(collapsed || moreOpen) && (
          <div className={collapsed ? "space-y-1" : "ml-1 space-y-1 border-l border-white/[0.08] pl-2"}>
            {!collapsed && (
              <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Raporlar</div>
            )}
            <NavItem href="/harita" active={active("harita")} icon={<IconGlobe className="h-4 w-4" />} collapsed={collapsed} label="Harita">
              Harita
            </NavItem>
            <NavItem href="/trend" active={active("trend")} icon={<IconTrendingUp className="h-4 w-4" />} collapsed={collapsed} label="Trend">
              Trend
            </NavItem>
            <NavItem href="/digest" active={active("digest")} icon={<IconMessage className="h-4 w-4" />} collapsed={collapsed} label="Digest">
              Digest
            </NavItem>
          </div>
        )}
      </nav>

      {!collapsed && <div className="flex min-h-0 flex-1 flex-col">{children}</div>}
      {collapsed && <div className="min-h-0 flex-1" />}

      <div className={`shrink-0 ${collapsed ? "mt-3 border-t border-white/[0.14] pt-3" : "mt-2 pt-1"}`}>
        <div ref={adminWrapRef} className="relative">
          {adminOpen && (
            <div
              className={`absolute bottom-full z-20 mb-2 space-y-0.5 rounded-card border border-hair bg-elevated p-2 shadow-lg ${
                collapsed ? "left-0 w-56" : "left-1.5 right-1.5"
              }`}
            >
              <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Ayarlar</div>
              <NavItem href="/admin/tez" active={active("tez")} icon={<IconFileText className="h-4 w-4" />}>
                Tez
              </NavItem>
              <NavItem href="/admin/mercekler" active={active("mercekler")} icon={<IconAperture className="h-4 w-4" />}>
                Mercekler
              </NavItem>
              <NavItem href="/admin/toplama" active={active("toplama")} icon={<IconDownload className="h-4 w-4" />}>
                Toplama
              </NavItem>
              <NavItem href="/admin/metrikler" active={active("metrikler")} icon={<IconBarChart className="h-4 w-4" />}>
                Metrikler
              </NavItem>
            </div>
          )}

          <div className={`flex items-center gap-2 px-1.5 ${collapsed ? "flex-col" : ""}`}>
            {me && !collapsed && (
              <>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-xs font-bold text-white">
                  {initialsOf(me.display_name)}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-ink-secondary">{me.display_name}</span>
              </>
            )}
            {me && collapsed && (
              <div
                title={me.display_name}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-xs font-bold text-white"
              >
                {initialsOf(me.display_name)}
              </div>
            )}
            {me?.is_admin && (
              <button
                onClick={() => setAdminOpen((v) => !v)}
                title="Ayarlar"
                aria-label="Ayarlar"
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-btn transition ${
                  adminOpen || (current && ADMIN_KEYS.includes(current))
                    ? "bg-white/[0.08] text-ink"
                    : "text-ink-muted hover:bg-white/[0.05] hover:text-ink"
                }`}
              >
                <IconSliders className="h-4 w-4" />
              </button>
            )}
            {me && <LogoutButton />}
          </div>
        </div>
      </div>
    </div>
  );
}
