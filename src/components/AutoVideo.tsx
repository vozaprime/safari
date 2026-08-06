"use client";

import { useEffect, useRef } from "react";

/** A muted looping video that only plays while visible in the viewport. */
export default function AutoVideo({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLVideoElement).play().catch(() => {});
          } else {
            (entry.target as HTMLVideoElement).pause();
          }
        }
      },
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <video ref={ref} src={src} className={className} muted loop playsInline preload="metadata" />;
}
