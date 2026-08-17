"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { renderInline } from "@/lib/richtext";

export default function StoryHero({
  videoSrc,
  kicker,
  title,
  subtitle,
  cta1,
  cta2,
  scrollCue,
  scrub = false,
}: {
  videoSrc: string;
  kicker: string;
  title: string;
  subtitle: string;
  cta1: { label: string; href: string };
  cta2: { label: string; href: string };
  scrollCue: string;
  /** When true the hero is pinned and the video is scrubbed by scroll: the
   *  section stays fixed on screen while scrolling drives currentTime from 0 to
   *  the full duration, and the page only advances once the clip has finished.
   *  Falls back to a static first frame under reduced-motion. */
  scrub?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLVideoElement>(null);
  const grad = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = media.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Only the default (non-scrub) hero autoplays. The scrub hero is driven by
    // scroll instead — and shows a static first frame under reduced-motion.
    const autoplay = !scrub;

    const io =
      video && autoplay
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting) (entry.target as HTMLVideoElement).play().catch(() => {});
                else (entry.target as HTMLVideoElement).pause();
              }
            },
            { threshold: 0.05 }
          )
        : null;
    if (video && io) io.observe(video);

    if (reduce) {
      // Reduced motion: collapse the pin track to one screen and just paint the
      // first frame — no scrubbing, no autoplay for the scrub hero.
      if (scrub) {
        if (root.current) root.current.style.height = "100vh";
        if (video) {
          const paint = () => {
            try {
              video.currentTime = 0;
            } catch {}
          };
          if (video.readyState >= 1) paint();
          else video.addEventListener("loadedmetadata", paint, { once: true });
        }
      }
      return () => io?.disconnect();
    }

    // Scroll progress 0→1. For the pinned (scrub) hero the travel is the extra
    // height beyond one viewport; otherwise it's the section's own height.
    const progress = () => {
      const el = root.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const denom = scrub
        ? Math.max(rect.height - window.innerHeight, 1)
        : Math.max(rect.height, 1);
      return Math.min(Math.max(-rect.top / denom, 0), 1);
    };

    // Paint the frame matching the current scroll position as soon as the video
    // knows its duration (so it isn't blank before the first scroll).
    const seekToScroll = () => {
      const v = media.current;
      if (!v) return;
      const d = v.duration;
      if (d && isFinite(d)) v.currentTime = progress() * d;
    };
    if (scrub && video) video.addEventListener("loadedmetadata", seekToScroll);

    let raf = 0;
    let last = -1;
    const loop = () => {
      if (root.current) {
        const p = progress();
        if (Math.abs(p - last) > 0.003) {
          last = p;
          if (media.current) {
            const scale = scrub ? 1 + p * 0.1 : 1 + p * 0.18;
            media.current.style.transform = `translateZ(0) scale(${Math.round(scale * 1000) / 1000})`;
            if (scrub) {
              const d = media.current.duration;
              if (d && isFinite(d)) media.current.currentTime = p * d;
            }
          }
          if (scrub) {
            // Reveal the video as the caption clears so its motion is fully seen.
            if (grad.current) grad.current.style.opacity = Math.max(1 - p * 0.9, 0.2).toFixed(2);
            if (shade.current) shade.current.style.opacity = (p * 0.22).toFixed(2);
            if (content.current) {
              content.current.style.transform = `translate3d(0, ${Math.round(p * -60)}px, 0)`;
              content.current.style.opacity = Math.max(1 - p * 2, 0).toFixed(2);
            }
          } else {
            if (shade.current) shade.current.style.opacity = (p * 0.85).toFixed(2);
            if (content.current) {
              content.current.style.transform = `translate3d(0, ${Math.round(p * -90)}px, 0)`;
              content.current.style.opacity = Math.max(1 - p * 1.1, 0).toFixed(2);
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      if (video) video.removeEventListener("loadedmetadata", seekToScroll);
    };
  }, [scrub]);

  const stage = (
    <>
      <video
        ref={media}
        src={videoSrc}
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        autoPlay={!scrub}
        muted
        loop={!scrub}
        playsInline
        preload={scrub ? "auto" : "metadata"}
      />
      <div
        ref={grad}
        className="absolute inset-0 bg-gradient-to-r from-forest-deep/85 via-forest/55 to-forest/25"
      />
      <div ref={shade} className="absolute inset-0 bg-forest-deep opacity-0" />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-5">
        <div ref={content} className="will-change-transform">
          <p className="text-[11px] tracking-[0.3em] text-gold md:text-xs">{kicker}</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.12] md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory/80 md:text-lg">{renderInline(subtitle)}</p>
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
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.35em] text-ivory/70">{scrollCue}</span>
        <span className="scroll-cue-line block h-10 w-px bg-gold" />
      </div>
    </>
  );

  // Scrub hero: a tall track pins the stage while scroll drives the video.
  if (scrub) {
    return (
      <section ref={root} className="relative -mt-[72px] h-[300vh] bg-forest text-ivory">
        <div className="sticky top-0 h-screen min-h-[560px] overflow-hidden">{stage}</div>
      </section>
    );
  }

  return (
    <section
      ref={root}
      className="relative -mt-[72px] h-screen min-h-[560px] overflow-hidden bg-forest text-ivory"
    >
      {stage}
    </section>
  );
}
