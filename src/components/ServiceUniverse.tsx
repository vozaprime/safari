"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useScrollStage } from "@/lib/useScrollProgress";

export type UniverseGroup = {
  title: string;
  tag: string;
  image: string;
  collage: string[];
  services: { title: string; summary: string; href: string; icon?: string }[];
};

export default function ServiceUniverse({
  groups,
  kicker,
  title,
}: {
  groups: UniverseGroup[];
  kicker: string;
  title: string;
}) {
  const { ref: root, active } = useScrollStage<HTMLDivElement>(groups.length);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setReduced(true);
  }, []);

  if (reduced) {
    return (
      <div className="bg-forest text-ivory">
        <div className="mx-auto max-w-6xl px-5 pt-16">
          <p className="text-[11px] tracking-[0.3em] text-gold">{kicker}</p>
          <h2 className="font-display mt-3 text-3xl md:text-4xl">{title}</h2>
        </div>
        {groups.map((group, i) => (
          <section key={i} className="mx-auto max-w-6xl px-5 py-12">
            <h3 className="font-display text-2xl text-gold">{group.title}</h3>
            <p className="mt-2 text-ivory/75">{group.tag}</p>
            <ul className="mt-4 space-y-3">
              {group.services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-ivory/90 underline-offset-4 hover:text-gold hover:underline">
                    {s.title}
                  </Link>
                  <p className="mt-1 text-sm text-ivory/60">{s.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const group = groups[active];

  return (
    <div
      ref={root}
      id="service-universe"
      style={{ height: `${groups.length * 100 + 50}vh` }}
      className="relative bg-forest"
    >
      <div className="sticky top-0 h-screen overflow-hidden text-ivory">
        {groups.map((g, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            style={{ willChange: "opacity", transform: "translateZ(0)" }}
            aria-hidden={i !== active}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.image}
              alt=""
              className={`h-full w-full object-cover ${i === active ? "hero-kenburns" : ""}`}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest-deep/75 to-forest/35" />

        <div className="relative mx-auto flex h-full max-w-6xl items-center px-5">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div key={active}>
              <p className="universe-item-in text-[11px] tracking-[0.3em] text-gold">
                {kicker} · {String(active + 1).padStart(2, "0")} — {String(groups.length).padStart(2, "0")}
              </p>
              <h3 className="universe-item-in font-display mt-4 text-4xl md:text-5xl" style={{ animationDelay: "80ms" }}>
                {group.title}
              </h3>
              <p className="universe-item-in mt-3 max-w-md text-ivory/80" style={{ animationDelay: "150ms" }}>
                {group.tag}
              </p>
              <ul className="mt-7 grid gap-3">
                {group.services.map((s, idx) => (
                  <li key={s.href} className="universe-item-in" style={{ animationDelay: `${220 + idx * 90}ms` }}>
                    <Link
                      href={s.href}
                      className="group block rounded-lg border border-ivory/15 bg-forest-deep/40 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-forest-deep/70 hover:shadow-xl hover:shadow-forest-deep/60"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[15px] font-medium text-ivory transition-colors group-hover:text-gold">
                          {s.title}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-gold opacity-40 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true">
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-xs leading-relaxed text-ivory/60 transition-colors group-hover:text-ivory/80">
                        {s.summary}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div key={`collage-${active}`} className="story-step-in hidden justify-end gap-4 lg:flex">
              {group.collage.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={`h-64 w-44 rounded-lg border border-ivory/15 object-cover shadow-2xl shadow-forest-deep/60 ${
                    i === 0 ? "translate-y-6 -rotate-2" : "-translate-y-6 rotate-2"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
          {groups.map((_, i) => (
            <span
              key={i}
              className={`h-0.5 w-10 rounded transition-colors duration-500 ${
                i === active ? "bg-gold" : i < active ? "bg-gold/50" : "bg-ivory/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
