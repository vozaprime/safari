import Link from "next/link";
import ServiceIcon from "./ServiceIcon";
import TiltCard from "./TiltCard";

export default function ServiceCard({
  href,
  image,
  icon,
  title,
  summary,
  readMore,
}: {
  href: string;
  image: string;
  icon: string;
  title: string;
  summary: string;
  readMore: string;
}) {
  return (
    <TiltCard className="h-full">
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-sand bg-white transition-all hover:border-gold/60 hover:shadow-xl hover:shadow-forest/15"
      >
        <span className="relative block aspect-[16/9] overflow-hidden bg-forest">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-forest-deep/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-md bg-forest-deep/70 p-2 text-gold backdrop-blur-sm">
            <ServiceIcon icon={icon} className="h-5 w-5" />
          </span>
        </span>
        <span className="flex flex-1 flex-col p-5">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">{summary}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-dark">
            {readMore}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </Link>
    </TiltCard>
  );
}
