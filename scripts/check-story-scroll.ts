// StoryScroll render testleri.  npx tsx scripts/check-story-scroll.ts
//
// Projede React test cercevesi yok; bilesen react-dom/server ile statik olarak
// render edilip ciktisi denetleniyor. Effect'ler SSR'de calismadigi icin
// kaydirma davranisi degil, YALNIZCA isaretleme dogrulanir — bu da inceleme
// sirasinda hic denenmemis yollari (baslik/liste/kalin/gorsel) kapsar.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StoryScroll from "../src/components/StoryScroll";
import { parseBlocks } from "../src/lib/richtext";

let failures = 0;
function check(cond: boolean, note: string) {
  if (cond) console.log(`ok: ${note}`);
  else {
    console.error(`FAIL: ${note}`);
    failures++;
  }
}

const body = [
  "Birinci paragraf **kalin** icerir.",
  "## Araya giren baslik",
  "Ikinci paragraf.",
  "- birinci madde\n- ikinci madde",
  "> Bir alinti.",
  "Ucuncu paragraf.",
  "![1988 Cagaloglu ofisi](/uploads/tarihi.jpg)",
].join("\n\n");

const blocks = parseBlocks(body);
const bodyImages = blocks
  .filter((b) => b.kind === "image")
  .map((b) => (b.kind === "image" ? { src: b.src, alt: b.alt } : { src: "", alt: "" }));

const html = renderToStaticMarkup(
  React.createElement(StoryScroll, {
    blocks,
    scenes: [
      { src: "/s1.jpg", alt: "" },
      { src: "/s2.jpg", alt: "" },
      { src: "/s3.jpg", alt: "" },
      { src: "/s4.jpg", alt: "" },
      ...bodyImages,
    ],
    kicker: "HIKAYEMIZ",
    title: "Baslik",
    chapterLabel: "BOLUM",
  })
);

// --- icerik kaybi yok ---
check(html.includes("<strong>kalin</strong>"), "kalin isaret <strong> olarak render edilir");
check(!html.includes("**"), "ekranda ham ** kalmaz");
check(html.includes("Araya giren baslik"), "baslik blogu render edilir");
check(html.includes("birinci madde") && html.includes("ikinci madde"), "liste maddeleri render edilir");
check(html.includes("Bir alinti"), "alinti blogu render edilir");
check(!/\/uploads\/tarihi\.jpg[^>]*>[\s\S]{0,40}Ucuncu/.test(html), "govde gorseli metin akisinda degil");

// --- I4: baslik ust bosluk alir (first:mt-0 her zaman eslesiyordu) ---
const headingWrap = html.match(/<div class="reveal[^"]*"[^>]*>\s*<h3/);
check(!!headingWrap, "baslik sarmalayicisi bulunur");
check(!!headingWrap && headingWrap[0].includes("mt-12"), "baslik ust bosluk sinifini alir");
check(!!headingWrap && !headingWrap[0].includes("first:mt-0"), "ust bosluk first:mt-0 ile iptal edilmez");

// --- I3: govdeye gomulu gorselin alt metni korunur ---
check(html.includes("1988 Cagaloglu ofisi"), "govde gorselinin alt metni kaybolmaz");

// --- I2: panel gorselleri tembel yuklenir (xl alti display:none) ---
// Asil ozellik: hicbir gorsel eager yuklenmemeli. Panel xl altinda
// display:none olsa da isaretleme her zaman render edildigi icin, eager
// bir <img> mobilde gereksiz yere indirilir.
const allImgs = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
check(allImgs.length >= 5, "panel ve serit gorselleri render edilir (bulunan: " + allImgs.length + ")");
const eager = allImgs.filter((t) => !t.includes('loading="lazy"'));
check(eager.length === 0, "hicbir gorsel eager yuklenmez (eager: " + eager.length + ")");

// --- a11y: meta etiket ekran okuyucuya duyurulmaz ---
check(/aria-hidden="true"[^>]*>HIKAYEMIZ|HIKAYEMIZ[\s\S]{0,80}BOLUM/.test(html), "meta etiket render edilir");
const metaTag = html.match(/<span[^>]*>[^<]*HIKAYEMIZ[^<]*BOLUM[\s\S]{0,40}?<\/span>/);
check(!!metaTag && metaTag[0].includes('aria-hidden="true"'), "meta etiket aria-hidden tasir");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
