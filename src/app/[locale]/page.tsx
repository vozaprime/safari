import Link from "next/link";
import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import StatRing from "@/components/StatRing";
import ServiceIndex, { type IndexGroup } from "@/components/ServiceIndex";
import StoryHero from "@/components/StoryHero";
import AutoVideo from "@/components/AutoVideo";
import TiltCard from "@/components/TiltCard";
import ValueIcon from "@/components/ValueIcon";
import ReferencesStrip from "@/components/ReferencesMarquee";
import ProcessStory, { type StoryStep } from "@/components/ProcessStory";
import ServiceUniverse, { type UniverseGroup } from "@/components/ServiceUniverse";
import { ProseText } from "@/lib/richtext";
import { defaultLocale, getDict, isLocale, localePath, type Locale } from "@/lib/i18n";
import { getPageContent, getReferences, getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  return pageMetadata({ locale });
}

const CHAPTER_MEDIA: StoryStep["media"][] = [
  { type: "video", src: "/videos/hero-compass.mp4" },
  { type: "video", src: "/videos/story-route.mp4" },
  { type: "video", src: "/videos/hero-skyline.mp4" },
  { type: "video", src: "/videos/story-sunrise.mp4" },
];

const GROUP_DEFS = [
  {
    slugs: ["mali-danismanlik", "yatirim-danismanligi", "proje-yonetimi"],
    image: "/images/services/mali-danismanlik.jpg",
    collage: ["/images/services/yatirim-danismanligi.jpg", "/images/services/proje-yonetimi.jpg"],
  },
  {
    slugs: ["mali-ticari-hukuk-danismanligi", "uyum-denetim-danismanligi"],
    image: "/images/services/mali-ticari-hukuk-danismanligi.jpg",
    collage: ["/images/services/uyum-denetim-danismanligi.jpg"],
  },
  {
    slugs: ["ticaret-is-gelistirme", "pazar-arastirmasi-pazara-giris", "sirket-kurulusu", "lojistik-gumruk-danismanligi"],
    image: "/images/services/lojistik-gumruk-danismanligi.jpg",
    collage: ["/images/services/pazar-arastirmasi-pazara-giris.jpg", "/images/services/ticaret-is-gelistirme.jpg"],
  },
  {
    slugs: ["kurumsal-kimlik-marka", "gayrimenkul-danismanligi", "oturma-calisma-izni-vatandaslik", "cozum-ortakliklari"],
    image: "/images/services/oturma-calisma-izni-vatandaslik.jpg",
    collage: ["/images/services/gayrimenkul-danismanligi.jpg", "/images/services/kurumsal-kimlik-marka.jpg"],
  },
];

export default async function HomePage({
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
  const process = JSON.parse(content.process_json ?? "[]") as { title: string; text: string }[];

  const steps: StoryStep[] = process.map((step, i) => ({
    title: step.title,
    text: step.text,
    media: CHAPTER_MEDIA[i % CHAPTER_MEDIA.length],
  }));

  const groupTexts = [
    { title: t.story.g1_title, tag: t.story.g1_tag },
    { title: t.story.g2_title, tag: t.story.g2_tag },
    { title: t.story.g3_title, tag: t.story.g3_tag },
    { title: t.story.g4_title, tag: t.story.g4_tag },
  ];
  const grouped = new Set(GROUP_DEFS.flatMap((g) => g.slugs));
  const groups: UniverseGroup[] = GROUP_DEFS.map((def, i) => ({
    title: groupTexts[i].title,
    tag: groupTexts[i].tag,
    image: def.image,
    collage: def.collage,
    services: def.slugs
      .map((slug) => services.find((s) => s.slug === slug))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => ({ title: s.title, summary: s.summary, icon: s.icon, href: localePath(locale, "services", s.slug) })),
  }));
  for (const s of services) {
    if (!grouped.has(s.slug)) {
      groups[groups.length - 1].services.push({
        title: s.title,
        summary: s.summary,
        icon: s.icon,
        href: localePath(locale, "services", s.slug),
      });
    }
  }

  const imageBySlug = new Map(services.map((s) => [s.slug, s.image]));
  const groupOffsets = groups.map((_, gi) =>
    groups.slice(0, gi).reduce((sum, g) => sum + g.services.length, 0)
  );
  const indexGroups: IndexGroup[] = groups.map((group, gi) => ({
    label: group.title,
    items: group.services.map((s, si) => {
      const slug = s.href.split("/").pop() ?? "";
      return {
        num: groupOffsets[gi] + si + 1,
        title: s.title,
        summary: s.summary,
        href: s.href,
        image: imageBySlug.get(slug) ?? `/images/services/${slug}.jpg`,
        icon: s.icon ?? "finance",
      };
    }),
  }));

  const stats = [
    { value: services.length, suffix: "", label: t.hero.stat_services },
    { value: references.length, suffix: "+", label: t.hero.stat_references },
    { value: 3, suffix: "", label: t.hero.stat_languages },
    { value: 6, suffix: "", label: t.hero.stat_partners },
  ];

  return (
    <>
      <StoryHero
        videoSrc="/videos/hero-journey.mp4"
        kicker={content.hero_kicker ?? ""}
        title={content.hero_title ?? ""}
        subtitle={content.hero_subtitle ?? ""}
        cta1={{ label: t.hero.cta1, href: localePath(locale, "services") }}
        cta2={{ label: t.hero.cta2, href: localePath(locale, "contact") }}
        scrollCue={t.story.scroll_cue}
      />

      <ProcessStory steps={steps} kicker={t.home.process_kicker} chapterLabel={t.story.chapter} />

      <ServiceUniverse groups={groups} kicker={t.story.universe_kicker} title={t.story.universe_title} />

      {/* Service index */}
      <ServiceIndex
        kicker={t.home.services_kicker}
        title={t.home.services_title}
        subtitle={t.home.services_subtitle}
        groups={indexGroups}
      />

      {/* Why us */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <AutoVideo
          src="/videos/story-route.mp4"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest via-forest/70 to-forest" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-[11px] tracking-[0.3em] text-gold">{t.home.why_kicker}</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">{content.why_title}</h2>
              <ProseText text={content.why_body ?? ""} className="mt-6 text-ivory/75" />

            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((value, i) => (
                <Reveal key={value.title} delay={(i % 2) as 0 | 1} className="h-full">
                  <TiltCard className="h-full">
                    <div className="glass-card group h-full rounded-lg border border-ivory/15 bg-white/[0.06] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:bg-white/[0.12] hover:shadow-xl hover:shadow-forest-deep/50">
                      <span className="inline-flex text-gold/80 transition-all duration-300 group-hover:scale-110 group-hover:text-gold">
                        <ValueIcon index={i} />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-gold">{value.title}</h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-ivory/75 transition-colors group-hover:text-ivory/90">
                        {value.text}
                      </p>
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-10 border-t border-emerald-line pt-12 md:grid-cols-4">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={(i % 4 > 2 ? 3 : (i % 4)) as 0 | 1 | 2 | 3}>
                <StatRing value={stat.value} suffix={stat.suffix} label={stat.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* References */}
      <section className="border-y border-sand bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="text-center text-[11px] tracking-[0.3em] text-gold-dark">{t.home.references_kicker}</p>
            <h2 className="font-display mt-3 text-center text-2xl text-forest md:text-3xl">
              {t.home.references_title}
            </h2>
          </Reveal>
        </div>
        <ReferencesStrip
          items={references.map((ref) => ({ name: ref.name, logo: ref.logo || undefined }))}
          href={localePath(locale, "references")}
        />
      </section>

      {/* CTA over sunrise video */}
      <section className="relative overflow-hidden bg-forest-deep text-ivory">
        <AutoVideo
          src="/videos/story-sunrise.mp4"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-forest-deep/55" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
          <Reveal>
            <h2 className="font-display mx-auto max-w-2xl text-3xl md:text-5xl">{t.home.cta_title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-ivory/75">{t.home.cta_text}</p>
            <Link
              href={localePath(locale, "contact")}
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
