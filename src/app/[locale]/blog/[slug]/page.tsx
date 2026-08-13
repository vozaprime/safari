import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import EditorialArticleBody from "@/components/EditorialArticleBody";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPost, getPostLocales, getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const post = await getPost(locale, slug);
  if (!post) return {};
  const available = await getPostLocales(slug);
  return pageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.title,
    description: post.excerpt,
    image: post.cover || undefined,
    type: "article",
    available,
  });
}

const dateLocale: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const post = await getPost(locale, slug);
  if (!post) notFound();

  const others = (await getPosts(locale)).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-ivory">
        {post.cover && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/95 via-forest/80 to-forest/60" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-5 py-16 md:py-24">
          <Reveal>
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-xs tracking-wide text-gold hover:text-ivory">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M19 12H5M11 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.blog.back}
            </Link>
            <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-gold">
              {new Date(post.createdAt).toLocaleDateString(dateLocale[locale] ?? "tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="font-display mt-3 text-3xl leading-tight md:text-5xl">{post.title}</h1>
            {post.excerpt && <p className="mt-4 max-w-2xl text-ivory/80">{post.excerpt}</p>}
          </Reveal>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-5 py-14 md:py-16">
        <EditorialArticleBody description={post.body} />
      </article>

      {others.length > 0 && (
        <section className="border-t border-sand bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="font-display text-2xl text-forest">{t.blog.related}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {others.map((p) => (
                <Link key={p.slug} href={`/${locale}/blog/${p.slug}`} className="group rounded-lg border border-sand p-5 transition-colors hover:border-gold/60">
                  <h3 className="font-display text-base text-ink group-hover:text-forest">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-stone">{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
