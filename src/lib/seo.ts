import type { Metadata } from "next";
import type { Locale } from "./i18n";
import { locales, defaultLocale, siteDescriptions } from "./i18n";

export const SITE_NAME = "SAFARI CONSULTING";
/** Landscape brand image used as the default social-share (OpenGraph) card. */
export const DEFAULT_OG_IMAGE = "/images/heroes/services.jpg";

const OG_LOCALE: Record<Locale, string> = { tr: "tr_TR", en: "en_US", ru: "ru_RU" };

/**
 * Builds canonical + hreflang alternates for a path. `available` restricts the
 * hreflang set to the locales where the page actually exists (defaults to all) —
 * important for dynamic pages whose translation may be missing in some locales,
 * so we never advertise an hreflang that 404s. Always adds an x-default.
 */
export function buildAlternates(
  locale: Locale,
  path: string,
  available: readonly Locale[] = locales
): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of available) languages[l] = `/${l}${path}`;
  const xDefault = available.includes(defaultLocale) ? defaultLocale : available[0];
  if (xDefault) languages["x-default"] = `/${xDefault}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

/**
 * Full, correct page metadata: title, description, canonical + hreflang, a
 * per-page OpenGraph card (with territory locale + image) and a Twitter card.
 * Falls back to the site description when a page has no specific one.
 */
export function pageMetadata(opts: {
  locale: Locale;
  path: string;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  available?: readonly Locale[];
}): Metadata {
  const { locale, path, title, type = "website", available } = opts;
  const description = opts.description || siteDescriptions[locale];
  const image = opts.image || DEFAULT_OG_IMAGE;
  const ogTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path, available),
    openGraph: {
      title: ogTitle,
      description,
      siteName: SITE_NAME,
      url: `/${locale}${path}`,
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
