import Reveal from "./Reveal";
import { renderInline } from "@/lib/richtext";

export default function PageHero({
  image,
  kicker,
  title,
  description,
}: {
  image: string;
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-forest text-ivory">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest/85 to-forest/55" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-deep/80 to-transparent" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
        <Reveal>
          <p className="text-[11px] tracking-[0.3em] text-gold">{kicker}</p>
          <h1 className="font-display mt-3 text-4xl md:text-5xl">{title}</h1>
          {description && <p className="mt-5 max-w-2xl leading-relaxed text-ivory/80">{renderInline(description)}</p>}
        </Reveal>
      </div>
    </section>
  );
}
