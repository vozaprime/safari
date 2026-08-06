import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import PageHero from "@/components/PageHero";
import { ProseText, renderInline } from "@/lib/richtext";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPageContent } from "@/lib/content";
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
  return { title: t.about.title, alternates: altLanguages("/about") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const content = await getPageContent(locale);
  const values = JSON.parse(content.values_json ?? "[]") as { title: string; text: string }[];

  return (
    <>
      <PageHero image="/images/heroes/about.jpg" kicker="SAFARI CONSULTING" title={t.about.title} />

      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <ProseText text={content.about_body ?? ""} className="text-stone" lead />

          </Reveal>
          <div className="space-y-5">
            <Reveal delay={1}>
              <div className="rounded-lg border-l-4 border-gold bg-white p-6 shadow-sm">
                <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-gold-dark">
                  {t.about.mission}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">{renderInline(content.about_mission ?? "")}</p>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div className="rounded-lg border-l-4 border-forest bg-white p-6 shadow-sm">
                <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-forest">
                  {t.about.vision}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink">{renderInline(content.about_vision ?? "")}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-forest text-ivory">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <Reveal>
            <p className="text-[11px] tracking-[0.3em] text-gold">{t.home.values_kicker}</p>
            <h2 className="font-display mt-3 text-3xl md:text-4xl">{t.home.values_title}</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={(i % 3) as 0 | 1 | 2}>
                <div className="h-full rounded-lg border border-emerald-line bg-emerald/40 p-5">
                  <h3 className="text-sm font-semibold text-gold">{value.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ivory/75">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
