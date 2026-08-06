import Link from "next/link";

export type RefItem = { name: string; logo?: string };

function CompassMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="shrink-0 opacity-60">
      <path d="M20 6 L23 17 L34 20 L23 23 L20 34 L17 23 L6 20 L17 17 Z" fill="#C9A227" />
    </svg>
  );
}

function MarqueeSet({ items, href, dup = false }: { items: RefItem[]; href: string; dup?: boolean }) {
  return (
    <div
      className={`flex w-max items-center gap-12 pr-12 ${dup ? "ref-dup" : ""}`}
      aria-hidden={dup || undefined}
    >
      {items.map((item) => (
        <Link
          key={item.name}
          href={href}
          tabIndex={dup ? -1 : undefined}
          className="group/ref flex items-center gap-12"
          title={item.name}
        >
          {item.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.logo}
              alt={item.name}
              className="h-8 w-auto max-w-44 object-contain opacity-55 grayscale transition-all duration-300 group-hover/ref:-translate-y-0.5 group-hover/ref:scale-110 group-hover/ref:opacity-100 group-hover/ref:grayscale-0 md:h-10"
            />
          ) : (
            <span className="font-display whitespace-nowrap text-xl tracking-wide text-stone/70 transition-all duration-300 group-hover/ref:-translate-y-0.5 group-hover/ref:text-forest md:text-2xl">
              {item.name}
            </span>
          )}
          <CompassMark />
        </Link>
      ))}
    </div>
  );
}

export default function ReferencesStrip({ items, href }: { items: RefItem[]; href: string }) {
  return (
    <div className="relative mt-10 overflow-hidden py-2">
      <div className="ref-track flex w-max">
        <MarqueeSet items={items} href={href} />
        <MarqueeSet items={items} href={href} dup />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}
