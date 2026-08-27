import type { MetadataRoute } from "next";
import { getAllLocalizedSlugs } from "@/lib/content";
import { locales, localePath, type RouteKey } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Listed in the order they appear in the main navigation. */
const staticRoutes: (RouteKey | undefined)[] = [
  undefined, // home
  "about",
  "services",
  "references",
  "contact",
  "blog",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { services, posts } = await getAllLocalizedSlugs();

  const entries: MetadataRoute.Sitemap = [];

  // Every URL here is the localized, visitor-facing one — the same address the
  // canonical tag advertises — so the sitemap never lists a URL that redirects.
  // A service or post missing a translation in some locale simply has no entry
  // for it, rather than an entry that would redirect or 404.
  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${SITE_URL}${localePath(locale, route)}`,
        changeFrequency: "monthly",
        priority: route === undefined ? 1 : 0.7,
      });
    }
    for (const slugs of services) {
      if (!slugs[locale]) continue;
      entries.push({
        url: `${SITE_URL}${localePath(locale, "services", slugs[locale])}`,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const slugs of posts) {
      if (!slugs[locale]) continue;
      entries.push({
        url: `${SITE_URL}${localePath(locale, "blog", slugs[locale])}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  return entries;
}
