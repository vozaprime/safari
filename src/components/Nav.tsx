"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { locales, localeNames, localePath, routeKeyFromSegment, routeSegments, type Locale } from "@/lib/i18n";

type NavLabels = {
  home: string;
  about: string;
  services: string;
  references: string;
  blog: string;
  contact: string;
};

type ServiceLink = { slug: string; title: string };

export default function Nav({
  locale,
  labels,
  logo,
  logoHeight,
  services = [],
  showBlog,
}: {
  locale: Locale;
  labels: NavLabels;
  logo?: string;
  logoHeight?: number;
  services?: ServiceLink[];
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
    { href: localePath(locale), label: labels.home },
    { href: localePath(locale, "about"), label: labels.about },
    { href: localePath(locale, "services"), label: labels.services, dropdown: true },
    { href: localePath(locale, "references"), label: labels.references },
    ...(showBlog ? [{ href: localePath(locale, "blog"), label: labels.blog }] : []),
    { href: localePath(locale, "contact"), label: labels.contact },
  ];
  const hasServices = services.length > 0;

  const isActive = (href: string) =>
    href === localePath(locale) ? pathname === href : pathname.startsWith(href);

  /**
   * Every page already publishes each locale's own address as an hreflang
   * alternate, and for a service or blog detail that is the only place the
   * translated slug is known — the layout renders this nav without knowing
   * which record the page is showing. So read them once the page is mounted.
   */
  const [alternates, setAlternates] = useState<Partial<Record<Locale, string>>>({});

  useEffect(() => {
    const found: Partial<Record<Locale, string>> = {};
    for (const l of locales) {
      const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l}"]`);
      if (link) found[l] = new URL(link.href).pathname;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- head'deki hreflang'ları okuyup dil bağlantılarını hedef dilin gerçek adresine çeken meşru senkronizasyon
    setAlternates(found);
  }, [pathname]);

  /**
   * Same page, other language. Prefers the alternate above; falls back to
   * re-spelling the route segment ("/tr/hakkimizda" → "/en/about"), which is
   * exact for static pages and, for a detail page, still lands on the right
   * address through that page's own 308.
   */
  const switchLocale = (target: Locale) => {
    const alternate = alternates[target];
    if (alternate) return alternate;
    const segments = pathname.split("/");
    segments[1] = target;
    const route = segments[2] ? routeKeyFromSegment(locale, segments[2]) : null;
    if (route) segments[2] = routeSegments[route][target];
    return segments.join("/") || localePath(target);
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
        <Link href={localePath(locale)} aria-label="SAFARI CONSULTING">
          <Logo src={logo || undefined} height={logoHeight} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {items.map((item) =>
            item.dropdown && hasServices ? (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`inline-flex items-center gap-1 text-[13px] tracking-wide transition-colors ${
                    isActive(item.href) ? "text-gold" : "text-ivory/85 hover:text-gold"
                  }`}
                >
                  {item.label}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                {/* hover dropdown */}
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-4 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none">
                  <div className="grid w-[540px] grid-cols-2 gap-0.5 rounded-xl border border-emerald-line bg-forest-deep/95 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-md">
                    {services.map((s) => (
                      <Link
                        key={s.slug}
                        href={localePath(locale, "services", s.slug)}
                        className="group/svc flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-ivory/85 transition-colors hover:bg-emerald/50 hover:text-gold"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold/50 transition-all group-hover/svc:scale-125 group-hover/svc:bg-gold motion-reduce:transition-none" />
                        <span className="truncate">{s.title}</span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="ml-auto h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/svc:translate-x-0 group-hover/svc:opacity-100 motion-reduce:transition-none"
                          aria-hidden="true"
                        >
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] tracking-wide transition-colors ${
                  isActive(item.href) ? "text-gold" : "text-ivory/85 hover:text-gold"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
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
          {items.map((item) =>
            item.dropdown && hasServices ? (
              <div key={item.href} className="border-b border-emerald-line/50">
                <Link
                  href={item.href}
                  className={`block py-3.5 text-sm ${isActive(item.href) ? "text-gold" : "text-ivory/90"}`}
                >
                  {item.label}
                </Link>
                <div className="grid grid-cols-2 gap-x-3 pb-3 pl-2">
                  {services.map((s) => (
                    <Link
                      key={s.slug}
                      href={localePath(locale, "services", s.slug)}
                      className="flex items-center gap-2 py-1.5 text-[12.5px] leading-snug text-ivory/60 transition-colors hover:text-gold"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                      <span className="truncate">{s.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`block border-b border-emerald-line/50 py-3.5 text-sm ${
                  isActive(item.href) ? "text-gold" : "text-ivory/90"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
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
