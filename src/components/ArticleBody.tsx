import Reveal from "./Reveal";
import { parseBlocks, renderInline } from "@/lib/richtext";

export default function ArticleBody({
  description,
  inlineImage,
  inlineAlt,
}: {
  description: string;
  inlineImage?: string;
  inlineAlt?: string;
}) {
  const blocks = parseBlocks(description);

  // Insert the inline image just before the 2nd heading, so it breaks the
  // article roughly a third of the way down rather than at the very top.
  const headingIdx = blocks.map((b, i) => (b.kind === "heading" ? i : -1)).filter((i) => i >= 0);
  const imageBefore = headingIdx.length >= 2 ? headingIdx[1] : -1;

  let firstPara = true;

  return (
    <div>
      {blocks.map((block, i) => {
        const nodes: React.ReactNode[] = [];

        if (i === imageBefore && inlineImage) {
          nodes.push(
            <Reveal key={`img-${i}`}>
              <figure className="my-10 overflow-hidden rounded-xl border border-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inlineImage} alt={inlineAlt ?? ""} className="aspect-[3/2] w-full object-cover" />
              </figure>
            </Reveal>
          );
        }

        if (block.kind === "heading") {
          nodes.push(
            <Reveal key={i}>
              <h2 className="font-display mt-12 flex items-center gap-3 text-2xl text-forest md:text-[26px]">
                <span className="h-px w-8 bg-gold" aria-hidden="true" />
                {renderInline(block.text)}
              </h2>
            </Reveal>
          );
        } else if (block.kind === "quote") {
          nodes.push(
            <Reveal key={i}>
              <blockquote className="my-10 border-l-2 border-gold bg-ivory/60 py-2 pl-6">
                <p className="font-display text-xl leading-snug text-forest md:text-2xl">“{renderInline(block.text)}”</p>
              </blockquote>
            </Reveal>
          );
        } else if (block.kind === "list") {
          nodes.push(
            <Reveal key={i}>
              <ul className="mt-5 space-y-2.5">
                {block.items.map((it, j) => (
                  <li key={j} className="flex gap-3 leading-[1.85] text-stone">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          );
        } else {
          const dropCap = firstPara;
          firstPara = false;
          nodes.push(
            <Reveal key={i}>
              <p
                className={`mt-5 leading-[1.85] text-stone ${
                  dropCap
                    ? "text-lg text-ink first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:font-medium first-letter:leading-[0.8] first-letter:text-gold-dark"
                    : ""
                }`}
              >
                {renderInline(block.text)}
              </p>
            </Reveal>
          );
        }

        return nodes;
      })}
    </div>
  );
}
