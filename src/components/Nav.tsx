"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { locales, localeNames, type Locale } from "@/lib/i18n";

type NavLabels = {
  home: string;
  about: string;
  services: string;
  references: string;
  blog: string;
  contact: string;
};

export default function Nav({
  locale,
  labels,
  logo,
  showBlog,
}: {
  locale: Locale;
  labels: NavLabels;
  logo?: string;
  showBlog?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gezinme (pathname) değişince mobil menüyü kapatan meşru reaktif effect
    setOpen(false);
  }, [pathname]);

  const items = [
    { href: `/${locale}`, label: labels.home },
    { href: `/${locale}/about`, label: labels.about },
    { href: `/${locale}/services`, label: labels.services },
    { href: `/${locale}/references`, label: labels.references },
    ...(showBlog ? [{ href: `/${locale}/blog`, label: labels.blog }] : []),
    { href: `/${locale}/contact`, label: labels.contact },
  ];

  const isActive = (href: string) =>
    href === `/${locale}` ? pathname === href : pathname.startsWith(href);

  const switchLocale = (target: string) => {
    const segments = pathname.split("/");
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? "bg-forest-deep/95 border-emerald-line backdrop-blur"
          : "bg-forest/80 border-transparent backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5">
        <Link href={`/${locale}`} aria-label="SAFARI CONSULTING">
          <Logo src={logo || undefined} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] tracking-wide transition-colors ${
                isActive(item.href) ? "text-gold" : "text-ivory/85 hover:text-gold"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-3 flex items-center gap-1 rounded border border-gold/50 p-0.5">
            {locales.map((l) => (
              <Link
                key={l}
                href={switchLocale(l)}
                aria-label={localeNames[l]}
                className={`rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                  l === locale ? "bg-gold text-gold-ink" : "text-gold hover:bg-gold/15"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </nav>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          <span className={`h-0.5 w-6 bg-ivory transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-ivory transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-ivory transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="border-t border-emerald-line bg-forest-deep px-5 pb-6 pt-3 lg:hidden" aria-label="Mobile">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block border-b border-emerald-line/50 py-3.5 text-sm ${
                isActive(item.href) ? "text-gold" : "text-ivory/90"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex gap-2">
            {locales.map((l) => (
              <Link
                key={l}
                href={switchLocale(l)}
                className={`rounded border px-3 py-1.5 text-xs uppercase tracking-wider ${
                  l === locale
                    ? "border-gold bg-gold text-gold-ink"
                    : "border-gold/50 text-gold"
                }`}
              >
                {localeNames[l]}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
