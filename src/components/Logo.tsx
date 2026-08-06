export default function Logo({ light = true, src }: { light?: boolean; src?: string }) {
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt="SAFARI CONSULTING" className="h-9 w-auto max-w-[180px] object-contain" />
    );
  }
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="18.5" stroke="#C9A227" strokeWidth="1.5" />
        <path d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z" fill="#C9A227" />
        <circle cx="20" cy="20" r="3" fill={light ? "#0B3D2E" : "#F7F4EC"} />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-lg tracking-[0.22em] ${light ? "text-ivory" : "text-forest"}`}
        >
          SAFARI
        </span>
        <span className="text-[10px] tracking-[0.42em] text-gold mt-1">CONSULTING</span>
      </span>
    </span>
  );
}
