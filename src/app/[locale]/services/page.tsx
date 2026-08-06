import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ServiceCard from "@/components/ServiceCard";
import PageHero from "@/components/PageHero";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getServices } from "@/lib/content";
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
  return { title: t.services.title, alternates: altLanguages("/services") };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const services = await getServices(locale);

  return (
    <>
      <PageHero
        image="/images/heroes/services.jpg"
        kicker="SAFARI CONSULTING"
        title={t.services.title}
        description={t.services.subtitle}
      />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={(i % 3) as 0 | 1 | 2} className="h-full">
              <ServiceCard
                href={`/${locale}/services/${service.slug}`}
                image={service.image}
                icon={service.icon}
                title={service.title}
                summary={service.summary}
                readMore={t.services.read_more}
              />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
