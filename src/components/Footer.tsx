import Link from "next/link";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";
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
          <Logo src={settings.site_logo || undefined} />
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-mist md:flex-row">
          <span>
            © {year} SAFARI CONSULTING. {t.footer.rights}
          </span>
          <span className="tracking-[0.2em]">FINANCE · INVESTMENT · TRADE · ADVISORY</span>
        </div>
      </div>
    </footer>
  );
}
