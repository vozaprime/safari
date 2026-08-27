import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Reveal from "@/components/Reveal";
import ServiceIcon from "@/components/ServiceIcon";
import EditorialArticleBody from "@/components/EditorialArticleBody";
import { defaultLocale, getDict, isLocale, localePath, type Locale } from "@/lib/i18n";
import { getService, getServices, resolveServiceSlug } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const service = await getService(locale, slug);
  if (!service) return {};
  return pageMetadata({
    locale,
    route: "services",
    subPaths: service.alternates,
    title: service.title,
    description: service.summary,
    image: service.image,
    type: "article",
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const service = await getService(locale, slug);
  // Another locale's spelling, or the name this service carried before a
  // rename: one permanent hop to the address this locale actually uses.
  if (!service) {
    const current = await resolveServiceSlug(locale, slug);
    if (current) permanentRedirect(localePath(locale, "services", current));
    notFound();
  }

  const others = (await getServices(locale)).filter((s) => s.slug !== slug).slice(0, 4);

  return (
    <>
      {/* Header — preserved exactly (forest hero with banner image) */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={service.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest/85 to-forest/60" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Reveal>
            <Link
              href={localePath(locale, "services")}
              className="inline-flex items-center gap-2 text-xs tracking-wide text-gold hover:text-ivory"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M19 12H5M11 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.services.back}
            </Link>
            <div className="mt-6 flex items-start gap-5">
              <span className="hidden rounded-lg border border-ivory/20 bg-forest-deep/50 p-4 text-gold backdrop-blur-sm md:block">
                <ServiceIcon icon={service.icon} className="h-9 w-9" />
              </span>
              <div>
                <h1 className="font-display text-3xl leading-tight md:text-5xl">{service.title}</h1>
                <p className="mt-4 max-w-2xl text-ivory/75">{service.summary}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Article — editorial redesign */}
      <article className="bg-ivory">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
          <EditorialArticleBody description={service.description} />

          {/* Scope */}
          {service.scope.length > 0 && (
            <Reveal className="mt-20">
              <div className="flex items-center gap-3.5 border-b border-sand pb-5">
                <span className="h-px w-9 bg-gold" aria-hidden="true" />
                <h2 className="font-display text-2xl font-medium text-forest md:text-3xl">{t.services.scope_title}</h2>
              </div>
              <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                {service.scope.map((item) => (
                  <li key={item} className="flex items-baseline gap-3.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden="true" />
                    <span className="font-semibold leading-[1.6] text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-2xl px-5 pb-24 text-center md:pb-28">
          <Reveal>
            <span className="mx-auto block h-px w-9 bg-gold" aria-hidden="true" />
            <h2 className="mt-7 font-display text-3xl font-medium leading-[1.15] text-forest md:text-[40px]">{t.services.detail_cta_title}</h2>
            <p className="mx-auto mt-5 max-w-lg leading-[1.7] text-stone">{t.services.detail_cta_text}</p>
            <Link
              href={`${localePath(locale, "contact")}?service=${service.slug}`}
              className="mt-8 inline-block bg-forest px-10 py-[18px] text-xs font-semibold uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-gold hover:text-forest"
            >
              {t.services.detail_cta_button}
            </Link>
          </Reveal>
        </div>
      </article>

      {/* Other services */}
      {others.length > 0 && (
        <section className="border-t border-sand bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14 md:py-16">
            <h2 className="font-display flex items-center gap-3 text-2xl text-forest">
              <span className="h-px w-8 bg-gold" aria-hidden="true" />
              {t.services.other_services}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={localePath(locale, "services", other.slug)}
                  className="group flex items-center gap-3 rounded-lg border border-sand bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-lg hover:shadow-forest/10"
                >
                  <span className="shrink-0 text-forest transition-colors group-hover:text-gold-dark">
                    <ServiceIcon icon={other.icon} className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium leading-snug text-ink">{other.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
