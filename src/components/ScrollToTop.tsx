"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Ring geometry — 56px button, 2px stroke, ~3px breathing room inside the edge. */
const R = 25;
const CIRC = 2 * Math.PI * R;
/** How far down the page the button waits before it appears. */
const SHOW_AFTER = 480;

type Lenis = { scrollTo: (target: number, opts?: { duration?: number }) => void };

/**
 * Fixed "back to top" button for the public site. The ring around it doubles as
 * a reading-progress indicator, and hovering sweeps a gold fill up through the
 * button while the arrow swaps for a fresh one climbing in from below.
 *
 * It lifts itself above the cookie bar via --sc-bottom-bar, which CookieConsent
 * publishes on <html> while its bar is on screen.
 */
export default function ScrollToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > SHOW_AFTER);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    };
    // Coalesce bursts of scroll events into one read per frame.
    const schedule = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const toTop = useCallback(() => {
    // Lenis drives the page when smooth scrolling is on; going through it keeps
    // the trip in sync with the rest of the site's scrolling.
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.1 });
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return (
    <div
      className="scroll-top-fab fixed right-5 z-[70] transition-[bottom] duration-300 ease-out sm:right-7"
      style={{ bottom: "calc(var(--sc-bottom-bar, 0px) + 1.25rem)" }}
    >
      <button
        type="button"
        onClick={toTop}
        aria-label={label}
        title={label}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className={`group relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-gold/30 bg-forest-deep/95 text-ivory shadow-xl shadow-black/30 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_0_30px_rgba(201,162,39,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-90 opacity-0"
        }`}
      >
        {/* Gold fill sweeping up from the bottom on hover. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 translate-y-full rounded-full bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
        />

        {/* Reading progress ring. */}
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            strokeWidth="2"
            className="stroke-ivory/15 transition-[stroke] duration-500 group-hover:stroke-gold-ink/20"
          />
          <circle
            cx="28"
            cy="28"
            r={R}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="stroke-gold group-hover:stroke-gold-ink"
            // Inline so the ring tracks the scroll tightly while the colour still eases.
            style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.5s ease" }}
          />
        </svg>

        {/* Arrow climbing out of the top while its twin rises into its place. */}
        <span
          aria-hidden="true"
          className="relative z-10 block h-[18px] w-[18px] overflow-hidden transition-colors duration-500 group-hover:text-gold-ink"
        >
          <Arrow className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[140%]" />
          <Arrow className="absolute inset-0 translate-y-[140%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
        </span>
      </button>
    </div>
  );
}

function Arrow({ className }: { className: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}
