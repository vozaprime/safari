import type { Metadata } from "next";
import type { Locale, RouteKey } from "./i18n";
import { locales, defaultLocale, localePath, siteDescriptions } from "./i18n";

export const SITE_NAME = "SAFARI CONSULTING";
/** Landscape brand image used as the default social-share (OpenGraph) card. */
export const DEFAULT_OG_IMAGE = "/images/heroes/services.jpg";

/** The domain the site is actually published on. */
const PRODUCTION_ORIGIN = "https://www.safarict.com";

/**
 * Origin used for canonical URLs, hreflang, OpenGraph and the sitemap.
 *
 * `SITE_URL` overrides it (local dev, staging, a domain change). A *.vercel.app
 * value is deliberately ignored in production: production once shipped with
 * SITE_URL pointing at the preview domain, which told search engines the
 * canonical copy of every page lived there instead of on the real domain — the
 * one failure mode this must never repeat silently.
 */
function resolveSiteUrl(): string {
  const isProd = process.env.NODE_ENV === "production";
  const fallback = isProd ? PRODUCTION_ORIGIN : "http://localhost:3000";
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return fallback;
  let host: string;
  try {
    host = new URL(raw).hostname;
  } catch {
    return fallback;
  }
  if (isProd && host.endsWith(".vercel.app")) return PRODUCTION_ORIGIN;
  return raw.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

const OG_LOCALE: Record<Locale, string> = { tr: "tr_TR", en: "en_US", ru: "ru_RU" };
/**
 * Builds canonical + hreflang alternates for a route. Each locale gets ITS OWN
 * path spelling (`/tr/hakkimizda` vs `/en/about`), so an hreflang never points
 * at a URL that only redirects.
 *
 * `subPaths` is for dynamic pages: locale → that locale's slug, covering only
 * the locales where the page actually exists, so we never advertise an hreflang
 * that 404s. Omit it for static pages — then all locales are listed with no
 * tail. Always adds an x-default.
 */
export function buildAlternates(
  locale: Locale,
  route?: RouteKey,
  subPaths?: Partial<Record<Locale, string>>
): Metadata["alternates"] {
  const available = subPaths ? locales.filter((l) => subPaths[l]) : locales;
  const languages: Record<string, string> = {};
  for (const l of available) languages[l] = localePath(l, route, subPaths?.[l]);
  const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0];
  if (xDefault) languages["x-default"] = localePath(xDefault, route, subPaths?.[xDefault]);
  return { canonical: localePath(locale, route, subPaths?.[locale]), languages };
}

/**
 * Full, correct page metadata: title, description, canonical + hreflang, a
 * per-page OpenGraph card (with territory locale + image) and a Twitter card.
 * Falls back to the site description when a page has no specific one.
 */
export function pageMetadata(opts: {
  locale: Locale;
  route?: RouteKey;
  subPaths?: Partial<Record<Locale, string>>;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const { locale, route, subPaths, title, type = "website" } = opts;
  const description = opts.description || siteDescriptions[locale];
  const image = opts.image || DEFAULT_OG_IMAGE;
  const ogTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const url = localePath(locale, route, subPaths?.[locale]);

  return {
    title,
    description,
    alternates: buildAlternates(locale, route, subPaths),
    openGraph: {
      title: ogTitle,
      description,
      siteName: SITE_NAME,
      url,
      type,
      locale: OG_LOCALE[locale],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
