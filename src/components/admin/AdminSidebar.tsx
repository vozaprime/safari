"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminIcon from "./icons";
import { logoutAction } from "@/app/admin/actions";

type Item = { href: string; label: string; icon: string; badge?: number; adminOnly?: boolean };

const items: Item[] = [
  { href: "/admin", label: "Genel Bakış", icon: "dashboard" },
  { href: "/admin/messages", label: "Talepler", icon: "inbox" },
  { href: "/admin/services", label: "Hizmetler", icon: "grid" },
  { href: "/admin/content", label: "Sayfa İçerikleri", icon: "document" },
  { href: "/admin/references", label: "Referanslar", icon: "star" },
  { href: "/admin/posts", label: "Blog", icon: "news" },
  { href: "/admin/media", label: "Medya", icon: "image" },
  { href: "/admin/users", label: "Kullanıcılar", icon: "users", adminOnly: true },
  { href: "/admin/activity", label: "Aktivite", icon: "activity", adminOnly: true },
  { href: "/admin/settings", label: "Ayarlar", icon: "settings", adminOnly: true },
];

export default function AdminSidebar({
  email,
  role,
  newCount,
}: {
  email: string;
  role: string;
  newCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = role === "admin";

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <>
      <div className="flex items-center justify-between border-b border-emerald-line px-5 py-5">
        <Link href="/admin" className="flex items-baseline gap-1.5" onClick={() => setOpen(false)}>
          <span className="font-display text-base tracking-[0.2em]">SAFARI</span>
          <span className="text-[9px] tracking-[0.3em] text-gold">ADMIN</span>
        </Link>
        <button
          className="text-ivory/70 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Menüyü kapat"
        >
          <AdminIcon name="x" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items
          .filter((i) => !i.adminOnly || isAdmin)
          .map((item) => {
            const active = isActive(item.href);
            const badge = item.href === "/admin/messages" ? newCount : item.badge;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                  active
                    ? "bg-gold/15 font-medium text-gold"
                    : "text-ivory/75 hover:bg-emerald/50 hover:text-ivory"
                }`}
              >
                <span className={active ? "text-gold" : "text-ivory/60"}>
                  <AdminIcon name={item.icon} />
                </span>
                <span className="flex-1">{item.label}</span>
                {badge ? (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-gold-ink">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-emerald-line px-5 py-4">
        <p className="truncate text-xs text-mist">{email}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gold/70">
          {isAdmin ? "Yönetici" : "Editör"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Link href="/tr" target="_blank" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
            Siteyi gör <AdminIcon name="external" className="h-3.5 w-3.5" />
          </Link>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-1 text-xs text-ivory/60 hover:text-red-300">
              <AdminIcon name="logout" className="h-3.5 w-3.5" /> Çıkış
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-forest-deep px-4 py-3 text-ivory md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menüyü aç" className="text-ivory">
          <AdminIcon name="menu" className="h-6 w-6" />
        </button>
        <span className="font-display text-sm tracking-[0.2em]">
          SAFARI <span className="text-[9px] text-gold">ADMIN</span>
        </span>
        {newCount ? (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-gold-ink">
            {newCount}
          </span>
        ) : (
          <span className="w-6" />
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-forest-deep text-ivory md:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-forest-deep/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-forest-deep text-ivory shadow-2xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
