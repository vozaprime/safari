import Link from "next/link";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";
import CookiePrefsLink from "./CookiePrefsLink";
import type { Locale } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

export default function Footer({
  locale,
  settings,
}: {
  locale: Locale;
  settings: Record<string, string>;
}) {
  const t = getDict(locale);
  const year = new Date().getFullYear();

  const links = [
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/services`, label: t.nav.services },
    { href: `/${locale}/references`, label: t.nav.references },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];

  return (
    <footer className="bg-forest-deep text-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <Logo src={settings.site_logo || undefined} height={Number(settings.logo_height) || undefined} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">{t.footer.tagline}</p>
          <SocialLinks settings={settings} className="mt-5" />
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
            {t.footer.quick_links}
          </h3>
          <ul className="mt-5 space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ivory/80 transition-colors hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
            {t.footer.contact}
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-ivory/80">
            {settings.contact_address && <li>{settings.contact_address}</li>}
            {settings.contact_phone && (
              <li>
                <a href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`} className="hover:text-gold">
                  {settings.contact_phone}
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-gold">
                  {settings.contact_email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-emerald-line">
        <div className="mx-auto max-w-6xl px-5 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-mist">
            <Link href={`/${locale}/cerez-politikasi`} className="transition-colors hover:text-gold">
              {t.footer.cookie_policy}
            </Link>
            <span aria-hidden="true" className="text-emerald-line">·</span>
            <Link href={`/${locale}/kvkk`} className="transition-colors hover:text-gold">
              {t.footer.kvkk}
            </Link>
            <span aria-hidden="true" className="text-emerald-line">·</span>
            <CookiePrefsLink label={t.footer.cookie_prefs} className="transition-colors hover:text-gold" />
          </div>
          <div className="mt-4 flex flex-col items-center justify-between gap-2 text-xs text-mist md:flex-row">
            <span>
              © {year} SAFARI CONSULTING. {t.footer.rights}
            </span>
            <span className="tracking-[0.2em]">FINANCE · INVESTMENT · TRADE · ADVISORY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
