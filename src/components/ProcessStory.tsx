"use client";

import { useEffect, useRef, useState } from "react";

export type StoryStep = {
  title: string;
  text: string;
  media: { type: "video" | "image"; src: string };
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export default function ProcessStory({
  steps,
  kicker,
  chapterLabel,
}: {
  steps: StoryStep[];
  kicker: string;
  chapterLabel: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const numRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLSpanElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }

    const n = steps.length;
    const FADE = 0.18; // fraction of a chapter spent cross-fading to the next
    let raf = 0;

    const loop = () => {
      const el = rootRef.current;
      if (el) {
        const vh = window.innerHeight;
        const rect = el.getBoundingClientRect();
        const range = rect.height - vh;
        const p = range > 0 ? clamp01(-rect.top / range) : 0;
        const seg = Math.min(p * n, n - 0.0001);
        const base = Math.floor(seg);
        const local = seg - base; // 0..1 progress within the current chapter
        const fadingOut = local > 1 - FADE ? (local - (1 - FADE)) / FADE : 0; // 0..1

        for (let i = 0; i < n; i++) {
          // ---- media layer ----
          const md = mediaRefs.current[i];
          if (md) {
            let op = 0;
            let scale = 1.04;
            if (i === base) {
              op = base === n - 1 ? 1 : 1 - fadingOut;
              scale = 1.04 + local * 0.09; // scroll-driven zoom across the chapter
            } else if (i === base + 1) {
              op = fadingOut;
              scale = 1.04;
            }
            md.style.opacity = op.toFixed(3);
            md.style.transform = `scale(${scale.toFixed(3)})`;
          }

          // ---- text layer ----
          const tx = textRefs.current[i];
          if (tx) {
            let op = 0;
            let ty = 0;
            if (i === base) {
              op = base === n - 1 ? 1 : 1 - fadingOut;
              ty = -local * 66; // rises upward as we scroll through the chapter
            } else if (i === base + 1) {
              op = fadingOut;
              ty = (1 - local) * 66; // enters from below during the cross-fade
            }
            tx.style.opacity = op.toFixed(3);
            tx.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
            tx.style.pointerEvents = op > 0.6 ? "auto" : "none";
          }
        }

        if (numRef.current) {
          numRef.current.textContent = String(base + 1).padStart(2, "0");
          numRef.current.style.transform = `translate3d(0, ${(local * 34 - 17).toFixed(1)}px, 0)`;
        }
        if (barRef.current) barRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
        if (metaRef.current) {
          metaRef.current.textContent = `${kicker} · ${chapterLabel} ${String(base + 1).padStart(
            2,
            "0"
          )} — ${String(n).padStart(2, "0")}`;
        }

        // ---- scroll-driven video scrubbing ----
        // The video timeline is bound to scroll: scrolling through a chapter
        // moves the playhead frame-by-frame instead of looping on its own.
        for (let i = 0; i < n; i++) {
          const v = videoRefs.current[i];
          if (!v || v.readyState < 1 || !isFinite(v.duration) || v.duration === 0) continue;
          if (!v.paused) v.pause();
          let frac = -1;
          if (i === base) frac = local;
          else if (i === base + 1) frac = 0; // primed at start, ready to scrub in
          if (frac < 0) continue;
          const target = clamp01(frac) * (v.duration - 0.05);
          if (Math.abs(v.currentTime - target) > 0.033) {
            try {
              v.currentTime = target;
            } catch {
              /* seek not ready yet */
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [steps.length, kicker, chapterLabel]);

  if (reduced) {
    return (
      <div className="bg-forest-deep text-ivory">
        {steps.map((step, i) => (
          <section key={i} className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.3em] text-gold">
                {chapterLabel} {String(i + 1).padStart(2, "0")} — {String(steps.length).padStart(2, "0")}
              </p>
              <h3 className="font-display mt-4 text-3xl md:text-4xl">{step.title}</h3>
              <p className="mt-5 leading-relaxed text-ivory/75">{step.text}</p>
            </div>
            {step.media.type === "video" ? (
              <video src={step.media.src} className="rounded-lg object-cover" autoPlay muted loop playsInline />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={step.media.src} alt="" className="rounded-lg object-cover" />
            )}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ height: `${steps.length * 100 + 40}vh` }} className="relative bg-forest-deep">
      <div className="sticky top-0 h-screen overflow-hidden text-ivory">
        {/* media layers */}
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              mediaRefs.current[i] = el;
            }}
            className="absolute inset-0 opacity-0 will-change-[opacity,transform]"
            style={{ transform: "scale(1.04)" }}
            aria-hidden="true"
          >
            {s.media.type === "video" ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={s.media.src}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="auto"
                onLoadedData={(e) => {
                  // Decode the first frame so a paused video renders immediately,
                  // then hand control of the playhead to the scroll loop.
                  const v = e.currentTarget;
                  v.pause();
                  try {
                    v.currentTime = 0.001;
                  } catch {
                    /* not seekable yet */
                  }
                }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={s.media.src} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/95 via-forest-deep/45 to-forest-deep/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/80 via-transparent to-transparent" />

        {/* giant scrubbing chapter number */}
        <span
          ref={numRef}
          className="font-display pointer-events-none absolute bottom-4 left-4 text-[30vh] leading-none text-ivory/[0.08] will-change-transform md:left-10"
          aria-hidden="true"
        >
          01
        </span>

        {/* meta label */}
        <span
          ref={metaRef}
          className="absolute left-5 top-24 text-[11px] tracking-[0.3em] text-gold md:left-10 md:top-28"
        />

        {/* stacked, scroll-driven text layers */}
        <div className="pointer-events-none absolute inset-0 mx-auto flex h-full max-w-6xl items-center px-5">
          <div className="relative ml-auto h-56 w-full max-w-xl md:h-64">
            {steps.map((step, i) => (
              <div
                key={i}
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className="absolute inset-0 flex flex-col justify-center opacity-0 will-change-[opacity,transform]"
              >
                <h3 className="font-display text-4xl leading-tight md:text-5xl">{step.title}</h3>
                <p className="mt-5 max-w-md text-base leading-relaxed text-ivory/80 md:text-lg">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* scroll progress track */}
        <div className="absolute right-5 top-1/2 hidden h-40 w-0.5 -translate-y-1/2 overflow-hidden rounded bg-ivory/15 md:block">
          <span
            ref={barRef}
            className="absolute inset-x-0 top-0 h-full origin-top bg-gold will-change-transform"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
      </div>
    </div>
  );
}
