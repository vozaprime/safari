import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import ServiceIcon from "@/components/ServiceIcon";
import ArticleBody from "@/components/ArticleBody";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getService, getServices } from "@/lib/content";
import { altLanguages } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Mid-article accent image per service (distinct from the top banner, same palette).
const inlineImages: Record<string, string> = {
  "mali-danismanlik": "/images/services/inline/charts.jpg",
  "yatirim-danismanligi": "/images/services/inline/coins.jpg",
  "pazar-arastirmasi-pazara-giris": "/images/services/inline/charts.jpg",
  "uyum-denetim-danismanligi": "/images/services/inline/charts.jpg",
  "mali-ticari-hukuk-danismanligi": "/images/services/mali-danismanlik.jpg",
  "ticaret-is-gelistirme": "/images/services/lojistik-gumruk-danismanligi.jpg",
  "sirket-kurulusu": "/images/about.jpg",
  "kurumsal-kimlik-marka": "/images/heroes/contact.jpg",
  "proje-yonetimi": "/images/about.jpg",
  "gayrimenkul-danismanligi": "/images/heroes/services.jpg",
  "oturma-calisma-izni-vatandaslik": "/images/services/pazar-arastirmasi-pazara-giris.jpg",
  "lojistik-gumruk-danismanligi": "/images/services/pazar-arastirmasi-pazara-giris.jpg",
  "cozum-ortakliklari": "/images/about.jpg",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const service = await getService(locale, slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    alternates: altLanguages(`/services/${slug}`),
  };
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
  if (!service) notFound();

  const others = (await getServices(locale)).filter((s) => s.slug !== slug).slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-ivory">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={service.image}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest/85 to-forest/60" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Reveal>
            <Link
              href={`/${locale}/services`}
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

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <div>
            <ArticleBody
              description={service.description}
              inlineImage={inlineImages[service.slug]}
              inlineAlt={service.title}
            />

            {service.scope.length > 0 && (
              <Reveal delay={1}>
                <h2 className="font-display mt-14 flex items-center gap-3 text-2xl text-forest">
                  <span className="h-px w-8 bg-gold" aria-hidden="true" />
                  {t.services.scope_title}
                </h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.scope.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-md border border-sand bg-white px-4 py-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm text-ink">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}

            <Reveal delay={2}>
              <div className="mt-12 rounded-lg bg-forest p-8 text-ivory">
                <h2 className="font-display text-2xl">{t.services.detail_cta_title}</h2>
                <p className="mt-2 text-sm text-ivory/70">{t.services.detail_cta_text}</p>
                <Link
                  href={`/${locale}/contact?service=${service.slug}`}
                  className="mt-6 inline-block rounded-md bg-gold px-7 py-3.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
                >
                  {t.services.detail_cta_button}
                </Link>
              </div>
            </Reveal>
          </div>

          <aside>
            <Reveal delay={1}>
              <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-gold-dark">
                {t.services.other_services}
              </h2>
              <ul className="mt-5 space-y-3">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/${locale}/services/${other.slug}`}
                      className="group flex items-center gap-4 rounded-lg border border-sand bg-white p-4 transition-colors hover:border-gold/60"
                    >
                      <span className="text-forest group-hover:text-gold-dark">
                        <ServiceIcon icon={other.icon} className="h-6 w-6" />
                      </span>
                      <span className="text-sm font-medium text-ink">{other.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
