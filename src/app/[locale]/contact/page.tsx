import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import PageHero from "@/components/PageHero";
import SocialLinks from "@/components/SocialLinks";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPageContent, getService, getServices, getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  return pageMetadata({ locale, route: "contact", title: t.contact.title, image: "/images/heroes/contact.jpg" });
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

      {settings.contact_address && (
        <section className="mx-auto max-w-6xl px-5 pt-16 md:pt-20">
          <Reveal>
            <div className="overflow-hidden rounded-lg border border-sand bg-white shadow-sm shadow-forest/5">
              <div className="flex flex-col gap-4 bg-forest px-6 py-5 text-ivory sm:flex-row sm:items-center sm:justify-between md:px-8">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ivory/10 text-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                      <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10Z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="11" r="2.2" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="font-display text-lg text-ivory">{t.contact.map_title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-ivory/70">{settings.contact_address}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.contact_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                    <path d="M3 11l19-9-9 19-2-8-8-2Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t.contact.directions}
                </a>
              </div>
              <div className="group relative aspect-[16/10] w-full sm:aspect-[21/9]">
                <iframe
                  title={t.contact.map_title}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.contact_address)}&z=14&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0 [filter:saturate(0.85)_contrast(1.03)_sepia(0.10)] transition-[filter] duration-500 group-hover:[filter:none]"
                />
              </div>
            </div>
          </Reveal>
        </section>
      )}

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
              <SocialLinks
                settings={settings}
                label={t.contact.follow_us}
                className="mt-7 border-t border-emerald-line/60 pt-6"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
