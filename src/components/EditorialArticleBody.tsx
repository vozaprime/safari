import Reveal from "./Reveal";
import { parseBlocks, renderInline } from "@/lib/richtext";

/**
 * Editorial article renderer shared by service detail and blog post pages:
 * `##` headings become numbered sections (01/02…), `>` quotes become centered
 * pull-quotes, `-` lists get gold square bullets, and `![images]` sit on an
 * offset deep-green panel whose side alternates.
 */
export default function EditorialArticleBody({ description }: { description: string }) {
  const blocks = parseBlocks(description);

  // Ordinals computed purely (no render-time mutation): a heading's section
  // number is the count of headings up to and including it; an image's index
  // is the count of images before it (drives the alternating panel side).
  const sectionNumber = (i: number) => blocks.slice(0, i + 1).filter((b) => b.kind === "heading").length;
  const imageIndex = (i: number) => blocks.slice(0, i).filter((b) => b.kind === "image").length;

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          const num = String(sectionNumber(i)).padStart(2, "0");
          return (
            <Reveal key={i} className={i === 0 ? "" : "mt-20"}>
              <div className="flex items-end gap-5 border-b border-sand pb-5 md:gap-7">
                <span className="font-display text-[52px] font-normal leading-[0.78] text-gold md:text-7xl">{num}</span>
                <h2 className="font-display text-2xl font-medium leading-[1.1] text-forest md:text-[40px]">
                  {renderInline(block.text)}
                </h2>
              </div>
            </Reveal>
          );
        }

        if (block.kind === "quote") {
          return (
            <Reveal key={i} className="my-16 md:my-20">
              <figure className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
                <span className="font-display text-7xl leading-[0.5] text-gold" aria-hidden="true">&ldquo;</span>
                <blockquote className="font-display text-2xl font-medium italic leading-[1.4] text-forest md:text-[30px]">
                  {renderInline(block.text)}
                </blockquote>
                <span className="h-px w-12 bg-gold" aria-hidden="true" />
              </figure>
            </Reveal>
          );
        }

        if (block.kind === "list") {
          return (
            <Reveal key={i} className="mt-8">
              <ul className="flex flex-col gap-3">
                {block.items.map((it, j) => (
                  <li key={j} className="flex items-baseline gap-3.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden="true" />
                    <span className="font-semibold leading-[1.7] text-ink">{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        }

        if (block.kind === "image") {
          const panelLeft = imageIndex(i) % 2 === 0;
          return (
            <Reveal key={i} className="my-14 md:my-16">
              <figure className={`relative ${panelLeft ? "pb-5 pl-5" : "pb-5 pr-5"}`}>
                <div
                  className={`absolute bottom-0 top-5 bg-forest ${panelLeft ? "left-0 right-5" : "left-5 right-0"}`}
                  aria-hidden="true"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className="relative block w-full" />
              </figure>
            </Reveal>
          );
        }

        return (
          <Reveal key={i} className={i === 0 ? "" : "mt-6"}>
            <p className="text-[17px] leading-[1.8] text-stone">{renderInline(block.text)}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
