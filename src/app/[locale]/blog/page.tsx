import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPosts } from "@/lib/content";
import { altLanguages } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  return { title: t.blog.title, alternates: altLanguages("/blog") };
}

const dateLocale: Record<string, string> = { tr: "tr-TR", en: "en-US", ru: "ru-RU" };

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const posts = await getPosts(locale);

  return (
    <>
      <PageHero image="/images/heroes/services.jpg" kicker="SAFARI CONSULTING" title={t.blog.title} description={t.blog.subtitle} />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        {posts.length === 0 ? (
          <p className="rounded-lg border border-sand bg-white px-5 py-12 text-center text-sm text-stone">{t.blog.empty}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) as 0 | 1 | 2} className="h-full">
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-sand bg-white transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-xl hover:shadow-forest/15"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden bg-forest">
                    {post.cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={post.cover} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-2xl text-gold/40">SAFARI</span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="text-[11px] uppercase tracking-wider text-gold-dark">
                      {new Date(post.createdAt).toLocaleDateString(dateLocale[locale] ?? "tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <h2 className="font-display mt-2 text-lg text-ink">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">{post.excerpt}</p>}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-dark">
                      {t.blog.read_more}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true">
                        <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
