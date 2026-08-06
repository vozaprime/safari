"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Splits a tall pinned container into `count` scroll stages and reports the
 * active stage index. React state only changes when the stage index changes
 * (not every frame), so components stay cheap while scrolling.
 *
 * `onFrame` (optional) fires every animation frame with the raw progress
 * (0..1 across the whole container) for imperative, ref-driven effects.
 *
 * Measured in a requestAnimationFrame loop rather than a scroll listener:
 * smooth-scroll libraries and some embedded browsers do not dispatch
 * native scroll events reliably.
 */
export function useScrollStage<T extends HTMLElement>(
  count: number,
  onFrame?: (progress: number, active: number) => void
) {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(0);
  const frameCb = useRef(onFrame);
  frameCb.current = onFrame;

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const range = rect.height - window.innerHeight;
        const p = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 0;
        const idx = Math.min(Math.floor(p * count), count - 1);
        setActive((prev) => (prev === idx ? prev : idx));
        frameCb.current?.(p, idx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return { ref, active };
}
