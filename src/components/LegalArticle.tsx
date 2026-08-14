import PageHero from "./PageHero";
import Reveal from "./Reveal";
import { ProseText } from "@/lib/richtext";
import type { LegalDoc } from "@/lib/legal";
import { getDict, type Locale } from "@/lib/i18n";

/** Shared layout for the public legal pages (Cookie Policy, KVKK notice):
 *  hero + last-updated line + prose body + a data-controller/contact card whose
 *  concrete details come from admin Settings. */
export default function LegalArticle({
  locale,
  doc,
  settings,
}: {
  locale: Locale;
  doc: LegalDoc;
  settings: Record<string, string>;
}) {
  const t = getDict(locale);
  const tel = settings.contact_phone?.replace(/[^+\d]/g, "");

  return (
    <>
      <PageHero image="/images/heroes/references.jpg" kicker={t.footer.legal} title={doc.title} />

      <section className="mx-auto max-w-3xl px-5 py-16 md:py-20">
        <p className="mb-8 text-xs uppercase tracking-wider text-stone">
          {t.legal.updated}: {doc.updated}
        </p>

        <Reveal>
          <ProseText text={doc.body} className="text-stone" lead />
        </Reveal>

        <div className="mt-12 rounded-xl border border-sand bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg text-forest">{t.legal.contact_title}</h2>
          <p className="mt-1 text-sm font-semibold text-ink">SAFARI CONSULTING</p>
          <dl className="mt-4 space-y-2 text-sm text-stone">
            {settings.contact_address && (
              <div>
                <dt className="inline font-medium text-ink">{t.contact.address}: </dt>
                <dd className="inline">{settings.contact_address}</dd>
              </div>
            )}
            {settings.contact_email && (
              <div>
                <dt className="inline font-medium text-ink">{t.contact.email}: </dt>
                <dd className="inline">
                  <a href={`mailto:${settings.contact_email}`} className="text-forest hover:text-gold">
                    {settings.contact_email}
                  </a>
                </dd>
              </div>
            )}
            {settings.contact_phone && (
              <div>
                <dt className="inline font-medium text-ink">{t.contact.phone}: </dt>
                <dd className="inline">
                  <a href={`tel:${tel}`} className="text-forest hover:text-gold">
                    {settings.contact_phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
