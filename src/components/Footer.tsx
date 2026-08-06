import Link from "next/link";
import Logo from "./Logo";
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
          {(settings.linkedin_url || settings.instagram_url) && (
            <div className="mt-5 flex items-center gap-3">
              {settings.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="grid h-9 w-9 place-items-center rounded-full border border-emerald-line text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21h-4z" />
                  </svg>
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border border-emerald-line text-ivory/80 transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
            </div>
          )}
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
