"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Reveal from "./Reveal";
import ServiceIcon from "./ServiceIcon";

export type IndexItem = {
  num: number;
  title: string;
  summary: string;
  href: string;
  image: string;
  icon: string;
};

export type IndexGroup = {
  label: string;
  items: IndexItem[];
};

export default function ServiceIndex({
  kicker,
  title,
  subtitle,
  groups,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  groups: IndexGroup[];
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const hasPointer = useRef(false);

  useEffect(() => {
    hasPointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasPointer.current) return;
    let raf = 0;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.16;
      pos.current.y += (target.current.y - pos.current.y) * 0.16;
      const el = previewRef.current;
      if (el) {
        el.style.transform = `translate3d(${Math.round(pos.current.x)}px, ${Math.round(
          pos.current.y
        )}px, 0) rotate(3deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e: React.MouseEvent) => {
    target.current = { x: e.clientX + 28, y: e.clientY - 90 };
  };

  const jumpToScene = (groupIndex: number) => {
    const el = document.getElementById("service-universe");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const range = rect.height - window.innerHeight;
    const y = top + range * ((groupIndex + 0.5) / groups.length);
    const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number) => void } }).__lenis;
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-[11px] tracking-[0.3em] text-gold-dark">{kicker}</p>
        <h2 className="font-display mt-3 text-3xl text-forest md:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-stone">{subtitle}</p>
      </Reveal>

      <div className="relative mt-12" onMouseMove={onMove} onMouseLeave={() => setPreview(null)}>
        {groups.map((group, groupIndex) => (
          <div key={group.label} className="mt-10 first:mt-0">
            <Reveal>
              <button
                type="button"
                onClick={() => jumpToScene(groupIndex)}
                className="group/label mb-2 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-gold-dark transition-colors hover:text-forest"
              >
                {group.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 opacity-0 transition-opacity group-hover/label:opacity-100" aria-hidden="true">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </Reveal>
            <ul>
              {group.items.map((item, i) => (
                <Reveal key={item.href} delay={(i % 3) as 0 | 1 | 2}>
                  <li className="border-b border-sand last:border-b-0">
                    <Link
                      href={item.href}
                      className="group flex items-baseline gap-5 py-5 transition-colors md:gap-8"
                      onMouseEnter={() => setPreview(item.image)}
                    >
                      <span className="font-display min-w-9 text-sm text-stone/60 transition-colors group-hover:text-gold-dark">
                        {String(item.num).padStart(2, "0")}
                      </span>
                      <span className="hidden translate-y-1 text-stone/50 transition-colors group-hover:text-gold-dark sm:block">
                        <ServiceIcon icon={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="font-display block text-xl leading-snug text-ink transition-all duration-300 group-hover:translate-x-2 group-hover:text-forest md:text-2xl">
                          {item.title}
                        </span>
                        <span className="block max-h-0 overflow-hidden text-sm leading-relaxed text-stone opacity-0 transition-all duration-300 group-hover:mt-1.5 group-hover:max-h-12 group-hover:opacity-100">
                          {item.summary}
                        </span>
                      </span>
                      <span className="flex h-9 w-9 shrink-0 translate-y-1.5 items-center justify-center self-center rounded-full border border-sand text-stone transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-gold-ink">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-45" aria-hidden="true">
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        ))}

        <div
          ref={previewRef}
          className={`pointer-events-none fixed left-0 top-0 z-40 hidden w-64 overflow-hidden rounded-lg border border-gold/40 shadow-2xl shadow-forest-deep/40 transition-opacity duration-300 lg:block ${
            preview ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="" className="aspect-[16/10] w-full object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}
