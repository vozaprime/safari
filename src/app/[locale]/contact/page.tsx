import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPageContent, getService, getServices, getSettings } from "@/lib/content";
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
  return { title: t.contact.title, alternates: altLanguages("/contact") };
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale: raw } = await params;
  const { service: serviceSlug } = await searchParams;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const [content, services, settings] = await Promise.all([
    getPageContent(locale, ["contact_intro"]),
    getServices(locale),
    getSettings(),
  ]);

  const preselected = serviceSlug ? (await getService(locale, serviceSlug))?.title ?? "" : "";

  return (
    <>
      <PageHero
        image="/images/heroes/contact.jpg"
        kicker="SAFARI CONSULTING"
        title={t.contact.title}
        description={content.contact_intro}
      />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
          <Reveal>
            <div className="rounded-lg border border-sand bg-white p-7 md:p-9">
              <ContactForm
                locale={locale}
                labels={t.contact}
                services={services.map((s) => ({ slug: s.slug, title: s.title }))}
                preselected={preselected}
              />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="rounded-lg bg-forest p-7 text-ivory md:p-9">
              <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-gold">
                {t.contact.info_title}
              </h2>
              <ul className="mt-7 space-y-6 text-sm">
                {settings.contact_address && (
                  <li>
                    <span className="block text-xs uppercase tracking-wider text-mist">{t.contact.address}</span>
                    <span className="mt-1 block text-ivory/90">{settings.contact_address}</span>
                  </li>
                )}
                {settings.contact_phone && (
                  <li>
                    <span className="block text-xs uppercase tracking-wider text-mist">{t.contact.phone}</span>
                    <a
                      href={`tel:${settings.contact_phone.replace(/[^+\d]/g, "")}`}
                      className="mt-1 block text-ivory/90 hover:text-gold"
                    >
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
                {settings.contact_email && (
                  <li>
                    <span className="block text-xs uppercase tracking-wider text-mist">{t.contact.email}</span>
                    <a href={`mailto:${settings.contact_email}`} className="mt-1 block text-ivory/90 hover:text-gold">
                      {settings.contact_email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
