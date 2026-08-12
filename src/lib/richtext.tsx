import React from "react";

export type RichBlock =
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "image"; src: string; alt: string }
  | { kind: "para"; text: string };

/** A standalone image line: ![alt](url) as its own paragraph. */
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** Convert inline **bold** and *italic* markers into React nodes. */
export function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={key++}>{m[1]}</strong>);
    else nodes.push(<em key={key++}>{m[2]}</em>);
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Parse mini-markdown text into structured blocks. */
export function parseBlocks(text: string): RichBlock[] {
  return (text || "")
    .replace(/\r\n?/g, "\n") // normalize Windows/Mac line endings from form submissions
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map<RichBlock>((block) => {
      if (block.startsWith("## ")) return { kind: "heading", text: block.slice(3).trim() };
      const img = block.match(IMAGE_RE);
      if (img) return { kind: "image", src: img[2], alt: img[1].trim() };
      const lines = block.split("\n");
      if (lines.every((l) => l.trim().startsWith("> "))) {
        return { kind: "quote", text: lines.map((l) => l.trim().slice(2)).join(" ").trim() };
      }
      if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
        return { kind: "list", items: lines.map((l) => l.trim().replace(/^[-*]\s+/, "")) };
      }
      return { kind: "para", text: block.replace(/\n/g, " ") };
    });
}

/**
 * Public prose renderer for editable content fields. Colors are inherited from
 * the parent so it works on both light and dark backgrounds. `lead` enlarges the
 * first paragraph.
 */
export function ProseText({
  text,
  className = "",
  lead = false,
}: {
  text: string;
  className?: string;
  lead?: boolean;
}) {
  const blocks = parseBlocks(text);
  const firstParaIdx = blocks.findIndex((b) => b.kind === "para");
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.kind === "image") {
          return (
            <figure key={i} className="my-6 overflow-hidden rounded-lg border border-sand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt} className="w-full" />
              {block.alt && (
                <figcaption className="bg-ivory/50 px-3 py-2 text-xs text-stone/80">{block.alt}</figcaption>
              )}
            </figure>
          );
        }
        if (block.kind === "heading") {
          return (
            <h3 key={i} className="font-display mt-8 text-xl font-medium first:mt-0">
              {renderInline(block.text)}
            </h3>
          );
        }
        if (block.kind === "quote") {
          return (
            <blockquote key={i} className="my-6 border-l-2 border-gold pl-5 font-display text-lg italic opacity-90">
              {renderInline(block.text)}
            </blockquote>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={i} className="my-4 space-y-1.5 pl-1">
              {block.items.map((it, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <span>{renderInline(it)}</span>
                </li>
              ))}
            </ul>
          );
        }
        const isLead = lead && i === firstParaIdx;
        return (
          <p key={i} className={`leading-relaxed ${isLead ? "mb-4 text-lg" : "mt-4 first:mt-0"}`}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
