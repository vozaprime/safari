"use client";

import { useEffect, useRef, useState } from "react";
import Counter from "./Counter";

const R = 52;
const CIRC = 2 * Math.PI * R;
const REST_FRACTION = 0.78;

export default function StatRing({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fraction = !visible ? 0 : hovered ? 1 : REST_FRACTION;

  return (
    <div
      ref={ref}
      className="group flex cursor-default flex-col items-center gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-36 w-36 transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(247,244,236,0.12)" strokeWidth="2" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#C9A227"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(0.25, 1, 0.4, 1)" }}
          />
          <circle
            cx="60"
            cy="60"
            r={R - 8}
            fill="none"
            stroke="rgba(201,162,39,0.35)"
            strokeWidth="1"
            strokeDasharray="2 7"
            className="stat-orbit"
          />
        </svg>
        <span className="font-display absolute inset-0 flex items-center justify-center text-4xl text-ivory transition-all duration-300 group-hover:text-gold group-hover:drop-shadow-[0_0_14px_rgba(201,162,39,0.55)]">
          <Counter target={value} suffix={suffix} />
        </span>
      </div>
      <span className="max-w-36 text-center text-[11px] uppercase tracking-[0.18em] text-mist transition-colors duration-300 group-hover:text-ivory">
        {label}
      </span>
    </div>
  );
}
