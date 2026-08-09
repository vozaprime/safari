import { prisma } from "./db";
import { locales, type Locale } from "./i18n";

/** Locales in which a service has a non-empty translation (for hreflang). */
export async function getServiceLocales(slug: string): Promise<Locale[]> {
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { translations: { select: { locale: true, title: true } } },
  });
  if (!service || !service.visible) return [];
  return service.translations
    .filter((t) => t.title.trim() !== "" && (locales as readonly string[]).includes(t.locale))
    .map((t) => t.locale as Locale);
}

/** Locales in which a published post has a non-empty translation (for hreflang). */
export async function getPostLocales(slug: string): Promise<Locale[]> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { translations: { select: { locale: true, title: true } } },
  });
  if (!post || !post.published) return [];
  return post.translations
    .filter((t) => t.title.trim() !== "" && (locales as readonly string[]).includes(t.locale))
    .map((t) => t.locale as Locale);
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
    where: { visible: true },
    orderBy: { order: "asc" },
    include: { translations: { where: { locale } } },
  });
  return services
    .filter((s) => s.translations.length > 0)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      icon: s.icon,
      image: s.image || `/images/services/${s.slug}.jpg`,
      title: s.translations[0].title,
      summary: s.translations[0].summary,
      description: s.translations[0].description,
      scope: JSON.parse(s.translations[0].scope) as string[],
    }));
}

export async function getService(locale: Locale, slug: string) {
  const service = await prisma.service.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!service || !service.visible || service.translations.length === 0) return null;
  return {
    id: service.id,
    slug: service.slug,
    icon: service.icon,
    image: service.image || `/images/services/${service.slug}.jpg`,
    title: service.translations[0].title,
    summary: service.translations[0].summary,
    description: service.translations[0].description,
    scope: JSON.parse(service.translations[0].scope) as string[],
  };
}

export async function getReferences() {
  return prisma.reference.findMany({ where: { visible: true }, orderBy: { order: "asc" } });
}

export async function getPosts(locale: Locale, publishedOnly = true) {
  const posts = await prisma.post.findMany({
    where: publishedOnly ? { published: true } : {},
    orderBy: { createdAt: "desc" },
    include: { translations: { where: { locale } } },
  });
  return posts
    .filter((p) => p.translations.length > 0 && p.translations[0].title)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      cover: p.cover,
      published: p.published,
      createdAt: p.createdAt,
      title: p.translations[0].title,
      excerpt: p.translations[0].excerpt,
    }));
}

export async function getPost(locale: Locale, slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!post || !post.published || post.translations.length === 0) return null;
  return {
    id: post.id,
    slug: post.slug,
    cover: post.cover,
    createdAt: post.createdAt,
    title: post.translations[0].title,
    excerpt: post.translations[0].excerpt,
    body: post.translations[0].body,
  };
}

export async function countPublishedPosts() {
  return prisma.post.count({ where: { published: true } });
}

export const POSTS_PER_PAGE = 9;

/** Paginated published posts for a locale (DB-level skip/take + total count). */
export async function getPublishedPostsPage(locale: Locale, page: number) {
  const where = { published: true, translations: { some: { locale, title: { not: "" } } } };
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
      slug: p.slug,
      cover: p.cover,
      published: p.published,
      createdAt: p.createdAt,
      title: p.translations[0].title,
      excerpt: p.translations[0].excerpt,
    }));
  return { items, total, page: safePage, perPage: POSTS_PER_PAGE };
}

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}
