import { prisma } from "./db";
import { locales, type Locale } from "./i18n";

/**
 * URL names are per locale: `ServiceTranslation.slug` / `PostTranslation.slug`
 * hold the visitor-facing spelling, and the record's own `slug` is the shared
 * fallback for translations that have none yet (anything created before the
 * column existed, or from the panel without one). Everything below goes through
 * these two helpers so the fallback lives in exactly one place.
 */
type TranslationSlug = { locale: string; slug: string | null; title: string };

/** The URL name this record uses in `locale`. */
export function slugIn(shared: string, translations: TranslationSlug[], locale: Locale): string {
  return translations.find((t) => t.locale === locale)?.slug || shared;
}

/**
 * Locale → URL name, for every locale the record is actually readable in.
 * Feeds hreflang, so a locale whose translation is missing or untitled is left
 * out rather than advertised as a URL that would 404.
 */
function alternatesFrom(shared: string, translations: TranslationSlug[]): Partial<Record<Locale, string>> {
  const map: Partial<Record<Locale, string>> = {};
  for (const t of translations) {
    if (t.title.trim() === "" || !(locales as readonly string[]).includes(t.locale)) continue;
    map[t.locale as Locale] = t.slug || shared;
  }
  return map;
}

export async function getPageContent(locale: Locale, keys?: string[]) {
  const rows = await prisma.pageContent.findMany({
    where: { locale, ...(keys ? { key: { in: keys } } : {}) },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function getServices(locale: Locale) {
  const services = await prisma.service.findMany({
    where: { visible: true, archivedAt: null },
    orderBy: { order: "asc" },
    include: { translations: { where: { locale } } },
  });
  return services
    .filter((s) => s.translations.length > 0)
    .map((s) => ({
      id: s.id,
      slug: s.translations[0].slug || s.slug,
      icon: s.icon,
      image: s.image || `/images/services/${s.slug}.jpg`,
      title: s.translations[0].title,
      summary: s.translations[0].summary,
      description: s.translations[0].description,
      scope: JSON.parse(s.translations[0].scope) as string[],
    }));
}

/**
 * A service by the URL name it uses in `locale`. Falls back to matching the
 * shared slug, but only for translations that carry no slug of their own — so a
 * locale that HAS its own name never also answers to another locale's spelling
 * (those get redirected instead, see `resolveServiceSlug`).
 */
export async function getService(locale: Locale, slug: string) {
  const where = { visible: true, archivedAt: null };
  const service =
    (await prisma.service.findFirst({
      where: { ...where, translations: { some: { locale, slug } } },
      include: { translations: true },
    })) ??
    (await prisma.service.findFirst({
      where: { ...where, slug, translations: { some: { locale, slug: null } } },
      include: { translations: true },
    }));

  const t = service?.translations.find((x) => x.locale === locale);
  if (!service || !t) return null;
  return {
    id: service.id,
    slug: t.slug || service.slug,
    icon: service.icon,
    image: service.image || `/images/services/${service.slug}.jpg`,
    title: t.title,
    summary: t.summary,
    description: t.description,
    scope: JSON.parse(t.scope) as string[],
    alternates: alternatesFrom(service.slug, service.translations),
  };
}

/**
 * Where a URL name that `locale` does not use should land: another locale's
 * spelling, or the shared slug from before the rename. Returns null when the
 * service is unknown or has nothing to show in this locale — then it is a 404,
 * not a redirect.
 */
export async function resolveServiceSlug(locale: Locale, slug: string): Promise<string | null> {
  const service = await prisma.service.findFirst({
    where: {
      visible: true,
      archivedAt: null,
      OR: [{ slug }, { translations: { some: { slug } } }],
    },
    include: { translations: true },
  });
  if (!service) return null;
  const t = service.translations.find((x) => x.locale === locale);
  if (!t || t.title.trim() === "") return null;
  return t.slug || service.slug;
}

export async function getReferences() {
  return prisma.reference.findMany({ where: { visible: true, archivedAt: null }, orderBy: { order: "asc" } });
}

export async function getPosts(locale: Locale, publishedOnly = true) {
  const posts = await prisma.post.findMany({
    where: { archivedAt: null, ...(publishedOnly ? { published: true } : {}) },
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale } } },
  });
  return posts
    .filter((p) => p.translations.length > 0 && p.translations[0].title)
    .map((p) => ({
      id: p.id,
      slug: p.translations[0].slug || p.slug,
      cover: p.cover,
      published: p.published,
      createdAt: p.createdAt,
      title: p.translations[0].title,
      excerpt: p.translations[0].excerpt,
    }));
}

/** A published post by the URL name it uses in `locale` (see `getService`). */
export async function getPost(locale: Locale, slug: string) {
  const where = { published: true, archivedAt: null };
  const post =
    (await prisma.post.findFirst({
      where: { ...where, translations: { some: { locale, slug } } },
      include: { translations: true },
    })) ??
    (await prisma.post.findFirst({
      where: { ...where, slug, translations: { some: { locale, slug: null } } },
      include: { translations: true },
    }));

  const t = post?.translations.find((x) => x.locale === locale);
  if (!post || !t) return null;
  return {
    id: post.id,
    slug: t.slug || post.slug,
    cover: post.cover,
    createdAt: post.createdAt,
    title: t.title,
    excerpt: t.excerpt,
    body: t.body,
    alternates: alternatesFrom(post.slug, post.translations),
  };
}

/** Where a foreign or stale post URL name should land (see `resolveServiceSlug`). */
export async function resolvePostSlug(locale: Locale, slug: string): Promise<string | null> {
  const post = await prisma.post.findFirst({
    where: {
      published: true,
      archivedAt: null,
      OR: [{ slug }, { translations: { some: { slug } } }],
    },
    include: { translations: true },
  });
  if (!post) return null;
  const t = post.translations.find((x) => x.locale === locale);
  if (!t || t.title.trim() === "") return null;
  return t.slug || post.slug;
}

/** The rows a locale's blog listing shows: published, not archived, non-empty title in that locale. */
function publishedPostsWhere(locale: Locale) {
  return { published: true, archivedAt: null, translations: { some: { locale, title: { not: "" } } } };
}

/** Count of posts visible on the given locale's blog (drives the Nav Blog link). */
export async function countPublishedPosts(locale: Locale) {
  return prisma.post.count({ where: publishedPostsWhere(locale) });
}

export const POSTS_PER_PAGE = 9;

/** Paginated published posts for a locale (DB-level skip/take + total count). */
export async function getPublishedPostsPage(locale: Locale, page: number) {
  const where = publishedPostsWhere(locale);
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      include: { translations: { where: { locale } } },
    }),
  ]);
  const items = posts
    .filter((p) => p.translations.length > 0 && p.translations[0].title)
    .map((p) => ({
      id: p.id,
      slug: p.translations[0].slug || p.slug,
      cover: p.cover,
      published: p.published,
      createdAt: p.createdAt,
      title: p.translations[0].title,
      excerpt: p.translations[0].excerpt,
    }));
  return { items, total, page: safePage, perPage: POSTS_PER_PAGE };
}

/**
 * Every locale's URL name for each visible service / published post, for the
 * sitemap. Shaped so callers never have to re-apply the shared-slug fallback.
 */
export async function getAllLocalizedSlugs() {
  const [services, posts] = await Promise.all([
    prisma.service.findMany({
      where: { visible: true, archivedAt: null },
      include: { translations: { select: { locale: true, slug: true, title: true } } },
    }),
    prisma.post.findMany({
      where: { published: true, archivedAt: null },
      include: { translations: { select: { locale: true, slug: true, title: true } } },
    }),
  ]);
  return {
    services: services.map((s) => alternatesFrom(s.slug, s.translations)),
    posts: posts.map((p) => alternatesFrom(p.slug, p.translations)),
  };
}

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}
