"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";

type Labels = {
  title: string;
  summary: string;
  details: string;
  accept: string;
  reject: string;
};

type Decision = "pending" | "prompt" | "accepted" | "rejected";

const STORAGE_KEY = "sc-cookie-consent-v1";
/** Footer "cookie preferences" dispatches this to reopen the bar. */
export const OPEN_PREFS_EVENT = "sc:open-cookie-preferences";

/**
 * KVKK-aligned cookie consent. Renders a slim single-line bar on first visit
 * (or when reopened from the footer) and loads Google Analytics ONLY after the
 * visitor accepts — "Reddet"/"Reject" is given equal prominence to "Kabul et".
 * The choice is remembered in localStorage so returning visitors aren't asked
 * again (and GA loads straight away if they had accepted).
 */
export default function CookieConsent({
  gaId,
  labels,
  policyHref,
}: {
  gaId?: string;
  labels: Labels;
  policyHref: string;
}) {
  // Start "pending" on both server and client so first paint matches (no
  // hydration mismatch); the effect then resolves the real state.
  const [decision, setDecision] = useState<Decision>("pending");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDecision(stored === "accepted" || stored === "rejected" ? stored : "prompt");

    const reopen = () => setDecision("prompt");
    window.addEventListener(OPEN_PREFS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFS_EVENT, reopen);
  }, []);

  const choose = useCallback((value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable (private mode) — still honour the choice this session */
    }
    setDecision(value);
  }, []);

  const showGA = Boolean(gaId) && decision === "accepted";
  const showBar = decision === "prompt";

  // Publish the bar's height so other bottom-docked UI (the back-to-top button)
  // can lift itself clear of it instead of hard-coding an offset.
  useEffect(() => {
    const root = document.documentElement;
    const el = barRef.current;
    if (!showBar || !el) {
      root.style.removeProperty("--sc-bottom-bar");
      return;
    }
    const measure = () => root.style.setProperty("--sc-bottom-bar", `${el.offsetHeight}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sc-bottom-bar");
    };
  }, [showBar]);

  return (
    <>
      {showGA && (
        <>
          <Script
            id="ga-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}

      {showBar && (
        <div
          ref={barRef}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div
            role="region"
            aria-label={labels.title}
            className="cookie-bar pointer-events-auto mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-emerald-line/70 bg-forest-deep/95 px-4 py-3.5 text-ivory shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:py-3"
          >
            <span aria-hidden="true" className="hidden shrink-0 text-gold sm:block">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 4 4 0 0 1-4-4 2 2 0 0 0-2-2Z" />
                <circle cx="9.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
                <circle cx="14.5" cy="15" r="1" fill="currentColor" stroke="none" />
                <circle cx="8.5" cy="15.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </span>

            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-ivory/85">
              {labels.summary}{" "}
              <Link
                href={policyHref}
                className="font-medium text-gold underline-offset-4 hover:underline"
              >
                {labels.details}
              </Link>
            </p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => choose("rejected")}
                className="rounded-md border border-ivory/30 px-4 py-2 text-[13px] font-medium text-ivory/90 transition-colors hover:border-ivory/60 hover:bg-white/5"
              >
                {labels.reject}
              </button>
              <button
                type="button"
                onClick={() => choose("accepted")}
                className="rounded-md bg-gold px-5 py-2 text-[13px] font-semibold text-gold-ink transition-colors hover:bg-gold-dark hover:text-ivory"
              >
                {labels.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
