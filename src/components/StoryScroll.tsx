"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import { renderInline, type RichBlock } from "@/lib/richtext";
import { bandIndices } from "@/lib/storyScenes";
import { useScrollStage } from "@/lib/useScrollProgress";

/**
 * Hakkımızda anlatısını ana sayfadaki hikâye bölümünün diliyle sahneler:
 * metin kendi sütununda normal akar, yanındaki fotoğraf paneli `xl` ve üzerinde
 * yapışkan kalır ve okuma ilerledikçe çapraz geçişle değişir.
 *
 * `ProcessStory`'den iki yerde ayrılır. Birincisi, sayfa yüksekliği şişirilmez
 * ve hiçbir sahne sabitlenmez — metnin tamamı okunabilir kalsın diye kaydırma
 * ele geçirilmiyor. İkincisi, bölüm açık zeminde durur; koyu kütleyi yalnızca
 * fotoğraf paneli getirir, böylece sayfanın koyu-açık ritmi korunur.
 *
 * Kaydırma takibi `useScrollStage` ile yapılır (rAF): site Lenis kullandığı için
 * native scroll olayları güvenilir değil. Kanca hem etkin sahneyi hem de sürekli
 * ilerleme değerini verdiğinden altın çubuk kademeli değil kesintisiz dolar.
 */
export default function StoryScroll({
  blocks,
  scenes,
  kicker,
  title,
  chapterLabel,
}: {
  blocks: RichBlock[];
  scenes: string[];
  kicker: string;
  title: string;
  chapterLabel: string;
}) {
  const barRef = useRef<HTMLSpanElement>(null);
  const sceneCount = Math.max(1, scenes.length);

  const { ref, active } = useScrollStage<HTMLDivElement>(sceneCount, (progress) => {
    if (barRef.current) barRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;
  });

  // Şeritler paragrafların önüne girer, bu yüzden paragraf indeksi blok
  // indeksinden ayrı sayılır: başlık/alıntı/liste araya girse de kayma olmaz.
  // Sıra numaraları render sırasında sayaç artırmak yerine önceden hesaplanır
  // (EditorialArticleBody ile aynı ilke: render saf kalsın).
  const paraIndexOf = new Map<number, number>();
  blocks.forEach((block, i) => {
    if (block.kind === "para") paraIndexOf.set(i, paraIndexOf.size);
  });

  const bandForParagraph = new Map<number, number>();
  bandIndices(paraIndexOf.size, sceneCount).forEach((paraIndex, sceneIndex) => {
    bandForParagraph.set(paraIndex, sceneIndex);
  });

  const activeScene = Math.min(Math.max(active, 0), sceneCount - 1);

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <Reveal>
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark">{kicker}</p>
        <h2 className="font-display mt-3 text-3xl text-forest md:text-4xl">{title}</h2>
        <div className="mt-4 h-1 w-16 rounded bg-gold" />
      </Reveal>

      <div className="mt-10 grid gap-10 xl:grid-cols-[1fr_minmax(0,520px)] xl:gap-16">
        {/* Anlatı */}
        <div>
          {blocks.map((block, i) => {
            if (block.kind === "image") return null; // sahne havuzuna taşındı

            const paraIndex = paraIndexOf.get(i);
            const band = paraIndex === undefined ? undefined : bandForParagraph.get(paraIndex);

            return (
              <div key={i}>
                {band !== undefined && scenes[band] && (
                  <figure className="my-10 overflow-hidden rounded-xl border border-sand xl:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scenes[band]} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
                  </figure>
                )}

                {block.kind === "heading" && (
                  <Reveal className="mt-12 first:mt-0">
                    <h3 className="font-display text-xl font-medium text-forest md:text-2xl">
                      {renderInline(block.text)}
                    </h3>
                  </Reveal>
                )}

                {block.kind === "quote" && (
                  <Reveal className="my-10">
                    <blockquote className="border-l-2 border-gold pl-5 font-display text-lg italic leading-relaxed text-forest md:text-xl">
                      {renderInline(block.text)}
                    </blockquote>
                  </Reveal>
                )}

                {block.kind === "list" && (
                  <Reveal className="mt-6">
                    <ul className="flex flex-col gap-3">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-baseline gap-3.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" aria-hidden="true" />
                          <span className="leading-[1.8] text-stone">{renderInline(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                )}

                {block.kind === "para" && (
                  <Reveal className={paraIndex === 0 ? "" : "mt-6"}>
                    <p
                      className={
                        paraIndex === 0
                          ? "text-[19px] leading-[1.75] text-ink md:text-xl"
                          : "text-[17px] leading-[1.8] text-stone"
                      }
                    >
                      {renderInline(block.text)}
                    </p>
                  </Reveal>
                )}
              </div>
            );
          })}
        </div>

        {/* Yapışkan fotoğraf paneli — yalnızca xl ve üzeri */}
        {scenes.length > 0 && (
          <div className="hidden xl:block">
            <div className="sticky top-[104px] h-[calc(100vh-10rem)] overflow-hidden rounded-xl bg-forest-deep">
              {scenes.map((src, i) => (
                <div
                  key={src + i}
                  aria-hidden="true"
                  className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                    i === activeScene ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className={`h-full w-full object-cover transition-transform duration-[1200ms] ease-out motion-reduce:transition-none motion-reduce:scale-100 ${
                      i === activeScene ? "scale-100" : "scale-105"
                    }`}
                  />
                </div>
              ))}

              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 via-transparent to-forest-deep/30" />

              <span
                aria-hidden="true"
                className="font-display pointer-events-none absolute bottom-2 left-5 text-[22vh] leading-none text-ivory/[0.14]"
              >
                {String(activeScene + 1).padStart(2, "0")}
              </span>

              <span className="absolute left-6 top-6 text-[11px] uppercase tracking-[0.3em] text-gold">
                {kicker} · {chapterLabel} {String(activeScene + 1).padStart(2, "0")} —{" "}
                {String(sceneCount).padStart(2, "0")}
              </span>

              <div className="absolute right-6 top-1/2 h-32 w-0.5 -translate-y-1/2 overflow-hidden rounded bg-ivory/20">
                <span
                  ref={barRef}
                  className="absolute inset-x-0 top-0 h-full origin-top bg-gold"
                  style={{ transform: "scaleY(0)" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
