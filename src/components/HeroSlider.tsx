"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export type HeroSlide = {
  media: { type: "video" | "image"; src: string };
  kicker: string;
  title: string;
  subtitle: string;
};

const INTERVAL = 9000;

export default function HeroSlider({
  slides,
  cta1,
  cta2,
  children,
}: {
  slides: HeroSlide[];
  cta1: { label: string; href: string };
  cta2: { label: string; href: string };
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, INTERVAL);
  }, [slides.length]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restartTimer]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const section = sectionRef.current;
        const media = mediaRef.current;
        const content = contentRef.current;
        if (!section || !media || !content) return;
        const rect = section.getBoundingClientRect();
        const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
        media.style.transform = `translate3d(0, ${progress * 90}px, 0) scale(${1 + progress * 0.12})`;
        content.style.transform = `perspective(900px) translate3d(0, ${progress * -40}px, 0) rotateX(${progress * 6}deg)`;
        content.style.opacity = String(1 - progress * 0.9);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (index: number) => {
    setActive(index);
    restartTimer();
  };

  const slide = slides[active];

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-forest text-ivory">
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== active}
          >
            {s.media.type === "video" ? (
              <video
                src={s.media.src}
                className={`h-full w-full object-cover ${i === active ? "hero-kenburns" : ""}`}
                autoPlay
                muted
                loop
                playsInline
                preload={i === 0 ? "auto" : "metadata"}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- proje bilinçli olarak next/image yerine düz <img>/<video> kullanıyor (ArticleBody ile tutarlı)
              <img
                src={s.media.src}
                alt=""
                className={`h-full w-full object-cover ${i === active ? "hero-kenburns" : ""}`}
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/90 via-forest/70 to-forest/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-forest-deep/90 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 md:pb-20 md:pt-32">
        <div ref={contentRef} className="will-change-transform" style={{ transformStyle: "preserve-3d" }}>
          <div key={active} className="hero-slide-in">
            <p className="text-[11px] tracking-[0.3em] text-gold md:text-xs">{slide.kicker}</p>
            <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.15] md:text-6xl">{slide.title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory/80 md:text-lg">{slide.subtitle}</p>
          </div>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={cta1.href}
              className="rounded-md bg-gold px-7 py-3.5 text-sm font-medium text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
            >
              {cta1.label}
            </Link>
            <Link
              href={cta2.href}
              className="rounded-md border border-ivory/40 bg-forest-deep/30 px-7 py-3.5 text-sm text-ivory backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
            >
              {cta2.label}
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === active}
                className="group relative h-6 w-12"
              >
                <span
                  className={`absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded transition-colors ${
                    i === active ? "bg-ivory/25" : "bg-ivory/25 group-hover:bg-ivory/50"
                  }`}
                >
                  {i === active && <span className="hero-progress absolute inset-y-0 left-0 bg-gold" />}
                </span>
              </button>
            ))}
          </div>

          {children}
        </div>
      </div>
    </section>
  );
}
