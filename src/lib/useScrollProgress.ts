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
  onFrame?: (progress: number, active: number) => void,
  /**
   * İlerlemeyi (0..1) ölçen isteğe bağlı fonksiyon. Varsayılan ölçü, kendisini
   * sabitleyen uzun kapsayıcılar içindir (`yükseklik - viewport`). Doğal
   * yükseklikte bir bölümün içinde yalnızca bir çocuk yapışkansa o ölçü yanlış
   * aralığı verir; böyle çağıranlar kendi aralıklarını buradan bildirir.
   */
  measure?: (rect: DOMRect, viewportHeight: number) => number
) {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(0);
  const frameCb = useRef(onFrame);
  const measureCb = useRef(measure);
  useEffect(() => {
    frameCb.current = onFrame;
    measureCb.current = measure;
  });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        let p: number;
        if (measureCb.current) {
          p = Math.min(Math.max(measureCb.current(rect, window.innerHeight), 0), 1);
        } else {
          const range = rect.height - window.innerHeight;
          p = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 0;
        }
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
