import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { locales, type Locale } from "./i18n";
import { CACHE_TAGS, REVALIDATE_SECONDS } from "./cacheTags";
import { clampPage, slugIsKnown, slugIsKnownInAnyLocale } from "./contentKeys";

/**
 * Bu dosyadaki okumalar `unstable_cache` ile önbelleklenir: public sayfalar
 * `force-dynamic` olduğu için her ziyaret ve her bot taraması veritabanına
 * iniyordu ve Prisma Free planının aylık 200.000 işlem hakkı 25 Kasım 2026'da
 * doldu. Gerekçe ve ölçümler:
 * `docs/superpowers/specs/2026-11-25-veri-katmani-onbellegi-design.md`.
 *
 * Her okumanın iki parçası var: `raw*` gerçek sorguyu yapar, dışa aktarılan ad
 * ise önbellekli sarmalayıcıdır. Slug ve sayfa numarası alan beşinde arada bir
 * de **önbelleksiz** doğrulama katmanı vardır — ziyaretçi girdisi doğrudan
 * önbellek anahtarına girerse anahtar uzayı sınırsız olur ve rastgele URL
 * tarayan bir bot kotayı yeniden tüketir.
 *
 * `unstable_cache` bilerek seçildi: girdileri deploy'ları aşar, `use cache`
 * ise aşmaz (anahtarına build ID girer). Prisma ORM 7'ye geçilirse burası
 * gözden geçirilmeli.
 */

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

async function rawGetPageContent(locale: Locale, keys?: string[]) {
  const rows = await prisma.pageContent.findMany({
    where: { locale, ...(keys ? { key: { in: keys } } : {}) },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export const getPageContent = unstable_cache(rawGetPageContent, ["getPageContent"], {
  tags: [CACHE_TAGS.pageContent],
  revalidate: REVALIDATE_SECONDS,
});

async function rawGetServices(locale: Locale) {
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

export const getServices = unstable_cache(rawGetServices, ["getServices"], {
  tags: [CACHE_TAGS.services],
  revalidate: REVALIDATE_SECONDS,
});

/**
 * A service by the URL name it uses in `locale`. Falls back to matching the
 * shared slug, but only for translations that carry no slug of their own — so a
 * locale that HAS its own name never also answers to another locale's spelling
 * (those get redirected instead, see `resolveServiceSlug`).
 */
async function rawGetService(locale: Locale, slug: string) {
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

const cachedGetService = unstable_cache(rawGetService, ["getService"], {
  tags: [CACHE_TAGS.services],
  revalidate: REVALIDATE_SECONDS,
});

/**
 * Slug ziyaretçiden geldiği için önce bilinen slug kümesine bakılır: bilinmeyen
 * bir slug veritabanına inmeden `null` döner ve önbellekte girdi açmaz.
 */
export async function getService(locale: Locale, slug: string) {
  const { services } = await getAllLocalizedSlugs();
  if (!slugIsKnown(services, locale, slug)) return null;
  return cachedGetService(locale, slug);
}

/**
 * Where a URL name that `locale` does not use should land: another locale's
 * spelling, or the shared slug from before the rename. Returns null when the
 * service is unknown or has nothing to show in this locale — then it is a 404,
 * not a redirect.
 */
async function rawResolveServiceSlug(locale: Locale, slug: string): Promise<string | null> {
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

const cachedResolveServiceSlug = unstable_cache(rawResolveServiceSlug, ["resolveServiceSlug"], {
  tags: [CACHE_TAGS.services],
  revalidate: REVALIDATE_SECONDS,
});

/**
 * Dil değiştirici buraya **başka bir dilin** slug'ıyla gelir, bu yüzden kontrol
 * tek dile değil bütün dillere bakar; yalnızca hedef dile bakan bir kontrol dil
 * değiştirmeyi sessizce kırardı.
 */
export async function resolveServiceSlug(locale: Locale, slug: string): Promise<string | null> {
  const { services } = await getAllLocalizedSlugs();
  if (!slugIsKnownInAnyLocale(services, slug)) return null;
  return cachedResolveServiceSlug(locale, slug);
}

async function rawGetReferences() {
  return prisma.reference.findMany({ where: { visible: true, archivedAt: null }, orderBy: { order: "asc" } });
}

export const getReferences = unstable_cache(rawGetReferences, ["getReferences"], {
  tags: [CACHE_TAGS.references],
  revalidate: REVALIDATE_SECONDS,
});

async function rawGetPosts(locale: Locale, publishedOnly = true) {
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

export const getPosts = unstable_cache(rawGetPosts, ["getPosts"], {
  tags: [CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

/** A published post by the URL name it uses in `locale` (see `getService`). */
async function rawGetPost(locale: Locale, slug: string) {
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

const cachedGetPost = unstable_cache(rawGetPost, ["getPost"], {
  tags: [CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

/** Bilinmeyen slug veritabanına inmeden `null` döner (bkz. `getService`). */
export async function getPost(locale: Locale, slug: string) {
  const { posts } = await getAllLocalizedSlugs();
  if (!slugIsKnown(posts, locale, slug)) return null;
  return cachedGetPost(locale, slug);
}

/** Where a foreign or stale post URL name should land (see `resolveServiceSlug`). */
async function rawResolvePostSlug(locale: Locale, slug: string): Promise<string | null> {
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

const cachedResolvePostSlug = unstable_cache(rawResolvePostSlug, ["resolvePostSlug"], {
  tags: [CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

/** Dil değiştirici başka dilin slug'ıyla gelir (bkz. `resolveServiceSlug`). */
export async function resolvePostSlug(locale: Locale, slug: string): Promise<string | null> {
  const { posts } = await getAllLocalizedSlugs();
  if (!slugIsKnownInAnyLocale(posts, slug)) return null;
  return cachedResolvePostSlug(locale, slug);
}

/** The rows a locale's blog listing shows: published, not archived, non-empty title in that locale. */
function publishedPostsWhere(locale: Locale) {
  return { published: true, archivedAt: null, translations: { some: { locale, title: { not: "" } } } };
}

/** Count of posts visible on the given locale's blog (drives the Nav Blog link). */
async function rawCountPublishedPosts(locale: Locale) {
  return prisma.post.count({ where: publishedPostsWhere(locale) });
}

export const countPublishedPosts = unstable_cache(rawCountPublishedPosts, ["countPublishedPosts"], {
  tags: [CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

export const POSTS_PER_PAGE = 9;

/**
 * Paginated published posts for a locale (DB-level skip/take + total count).
 * `page` buraya kırpılmış gelir; kırpma `getPublishedPostsPage`'te, önbelleğin
 * dışında yapılır.
 */
async function rawGetPublishedPostsPage(locale: Locale, page: number) {
  const where = publishedPostsWhere(locale);
  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * POSTS_PER_PAGE,
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
  return { items, total, page, perPage: POSTS_PER_PAGE };
}

const cachedGetPublishedPostsPage = unstable_cache(rawGetPublishedPostsPage, ["getPublishedPostsPage"], {
  tags: [CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

/**
 * Sayfa numarası `?page=` ile ziyaretçiden gelir. Önbelleğe girmeden önce
 * gerçek bir sayfaya kırpılır, yoksa `?page=999999` ayrı bir anahtar ve ayrı
 * bir sorgu açar. Aralık dışı değer son sayfayı gösterir.
 */
export async function getPublishedPostsPage(locale: Locale, page: number) {
  const total = await countPublishedPosts(locale);
  return cachedGetPublishedPostsPage(locale, clampPage(page, total, POSTS_PER_PAGE));
}

/**
 * Every locale's URL name for each visible service / published post, for the
 * sitemap. Shaped so callers never have to re-apply the shared-slug fallback.
 * Ayrıca slug doğrulamasının kaynağıdır: bilinen slug kümesi buradan gelir.
 */
async function rawGetAllLocalizedSlugs() {
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

export const getAllLocalizedSlugs = unstable_cache(rawGetAllLocalizedSlugs, ["getAllLocalizedSlugs"], {
  tags: [CACHE_TAGS.services, CACHE_TAGS.posts],
  revalidate: REVALIDATE_SECONDS,
});

async function rawGetSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export const getSettings = unstable_cache(rawGetSettings, ["getSettings"], {
  tags: [CACHE_TAGS.settings],
  revalidate: REVALIDATE_SECONDS,
});
