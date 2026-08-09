import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { renderInline } from "@/lib/richtext";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPageContent, getReferences } from "@/lib/content";
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
  return pageMetadata({ locale, path: "/references", title: t.references.title, image: "/images/heroes/references.jpg" });
}

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const [content, references] = await Promise.all([
    getPageContent(locale, ["references_intro", "references_note"]),
    getReferences(),
  ]);

  return (
    <>
      <PageHero
        image="/images/heroes/references.jpg"
        kicker="SAFARI CONSULTING"
        title={t.references.title}
        description={content.references_intro}
      />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {references.map((ref, i) => (
            <Reveal key={ref.id} delay={(i % 3) as 0 | 1 | 2}>
              <div className="group flex h-36 flex-col items-center justify-center gap-3 rounded-lg border border-sand bg-white p-6 transition-all hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg hover:shadow-forest/10">
                {ref.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={ref.logo}
                    alt={ref.name}
                    className="max-h-14 w-auto max-w-[75%] object-contain opacity-70 grayscale transition-all duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="font-display text-center text-xl tracking-wide text-forest">{ref.name}</span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={1}>
          <p className="mt-12 rounded-lg border-l-4 border-gold bg-white p-6 text-sm leading-relaxed text-stone">
            {renderInline(content.references_note ?? "")}
          </p>
        </Reveal>
      </section>
    </>
  );
}
