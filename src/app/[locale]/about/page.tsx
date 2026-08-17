import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import StoryHero from "@/components/StoryHero";
import AutoVideo from "@/components/AutoVideo";
import StatRing from "@/components/StatRing";
import TiltCard from "@/components/TiltCard";
import ValueIcon from "@/components/ValueIcon";
import ReferencesStrip from "@/components/ReferencesMarquee";
import { ProseText, renderInline } from "@/lib/richtext";
import { defaultLocale, getDict, isLocale, type Locale } from "@/lib/i18n";
import { getPageContent, getServices, getReferences } from "@/lib/content";
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
  return pageMetadata({ locale, path: "/about", title: t.about.title, image: "/images/heroes/about.jpg" });
}

const MissionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);
const VisionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const [content, services, references] = await Promise.all([
    getPageContent(locale),
    getServices(locale),
    getReferences(),
  ]);
  const values = JSON.parse(content.values_json ?? "[]") as { title: string; text: string }[];

  const stats = [
    { value: services.length, suffix: "", label: t.hero.stat_services },
    { value: references.length, suffix: "+", label: t.hero.stat_references },
    { value: 3, suffix: "", label: t.hero.stat_languages },
    { value: 6, suffix: "", label: t.hero.stat_partners },
  ];

  return (
    <>
      {/* Cinematic hero (same treatment as the homepage) */}
      <StoryHero
        videoSrc="/videos/about-lion.mp4"
        scrub
        kicker="SAFARI CONSULTING"
        title={t.about.story_title}
        subtitle={t.footer.tagline}
        cta1={{ label: t.hero.cta1, href: `/${locale}/services` }}
        cta2={{ label: t.hero.cta2, href: `/${locale}/contact` }}
        scrollCue={t.story.scroll_cue}
      />

      {/* Story narrative — editorial, with an image collage */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark">{t.about.story_kicker}</p>
            <h2 className="font-display mt-3 text-3xl text-forest md:text-4xl">{t.about.story_title}</h2>
            <div className="mt-4 h-1 w-16 rounded bg-gold" />
            <ProseText text={content.about_body ?? ""} className="mt-6 text-stone" lead />
          </Reveal>
          <Reveal delay={1}>
            <div className="relative">
              <div aria-hidden="true" className="absolute -right-4 -top-4 h-24 w-24 rounded-2xl border-2 border-gold/40" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/about.jpg" alt="" className="relative z-10 aspect-[4/5] w-full rounded-2xl object-cover shadow-xl shadow-forest/10" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/services/yatirim-danismanligi.jpg" alt="" className="absolute -bottom-6 -left-6 z-20 hidden aspect-square w-36 rounded-xl border-4 border-ivory object-cover shadow-lg shadow-forest/20 sm:block" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats over motion */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <AutoVideo src="/videos/story-route.mp4" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/70 to-forest" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <StatRing value={stat.value} suffix={stat.suffix} label={stat.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark">{t.about.mv_kicker}</p>
          <h2 className="font-display mt-3 text-3xl text-forest md:text-4xl">{t.about.mv_title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl border border-emerald-line bg-forest p-8 text-ivory md:p-10">
              <AutoVideo src="/videos/hero-skyline.mp4" className="absolute inset-0 h-full w-full object-cover opacity-[0.15]" />
              <div className="absolute inset-0 bg-forest/70" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <MissionIcon />
                </span>
                <h3 className="font-display mt-5 text-2xl text-gold">{t.about.mission}</h3>
                <p className="mt-3 leading-relaxed text-ivory/85">{renderInline(content.about_mission ?? "")}</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-sand bg-white p-8 shadow-sm shadow-forest/5 md:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/5" />
              <div className="relative">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-forest/10 text-forest">
                  <VisionIcon />
                </span>
                <h3 className="font-display mt-5 text-2xl text-forest">{t.about.vision}</h3>
                <p className="mt-3 leading-relaxed text-stone">{renderInline(content.about_vision ?? "")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values — glass cards over motion (homepage treatment) */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <AutoVideo src="/videos/hero-skyline.mp4" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/70 to-forest" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-24">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">{t.home.values_kicker}</p>
            <h2 className="font-display mt-3 max-w-2xl text-3xl md:text-4xl">{t.home.values_title}</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={(i % 3) as 0 | 1 | 2} className="h-full">
                <TiltCard className="h-full">
                  <div className="glass-card group h-full rounded-lg border border-ivory/15 bg-white/[0.06] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:bg-white/[0.12] hover:shadow-xl hover:shadow-forest-deep/50">
                    <span className="inline-flex text-gold/80 transition-all duration-300 group-hover:scale-110 group-hover:text-gold">
                      <ValueIcon index={i} />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-gold">{value.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-ivory/75 transition-colors group-hover:text-ivory/90">{value.text}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* References marquee */}
      {references.length > 0 && (
        <section className="border-y border-sand bg-white py-16">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal>
              <p className="text-center text-[11px] tracking-[0.3em] text-gold-dark">{t.home.references_kicker}</p>
              <h2 className="font-display mt-3 text-center text-2xl text-forest md:text-3xl">{t.home.references_title}</h2>
            </Reveal>
          </div>
          <ReferencesStrip items={references.map((ref) => ({ name: ref.name, logo: ref.logo || undefined }))} href={`/${locale}/references`} />
        </section>
      )}

      {/* CTA over sunrise video */}
      <section className="relative overflow-hidden bg-forest-deep text-ivory">
        <AutoVideo src="/videos/story-sunrise.mp4" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-forest-deep/55" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
          <Reveal>
            <h2 className="font-display mx-auto max-w-2xl text-3xl md:text-5xl">{t.home.cta_title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-ivory/75">{t.home.cta_text}</p>
            <Link
              href={`/${locale}/contact`}
              className="mt-8 inline-block rounded-md bg-gold px-8 py-4 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
            >
              {t.home.cta_button}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
