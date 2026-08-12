import { parseBlocks } from "../src/lib/richtext";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) { console.error("FAIL:", msg); failures++; } else { console.log("ok:", msg); }
}

// 1) Standalone image line becomes an image block
const b1 = parseBlocks("Giriş paragrafı.\n\n![Bir grafik](https://example.com/a.jpg)\n\n## Başlık");
assert(b1.length === 3, "üç blok ayrıştırıldı");
assert(b1[1].kind === "image", "ikinci blok image");
if (b1[1].kind === "image") {
  assert(b1[1].src === "https://example.com/a.jpg", "image src doğru");
  assert(b1[1].alt === "Bir grafik", "image alt doğru");
}

// 2) Empty alt is allowed
const b2 = parseBlocks("![](/uploads/x.png)");
assert(b2[0].kind === "image", "boş alt image olarak ayrıştırılır");
if (b2[0].kind === "image") assert(b2[0].alt === "", "boş alt boş string");

// 3) Image markdown mixed inside a text line stays a paragraph
const b3 = parseBlocks("Metin ![x](y.jpg) devam ediyor");
assert(b3[0].kind === "para", "satır içi görsel paragraf kalır");

// 4) Local upload path parses
const b4 = parseBlocks("![Logo](/uploads/logo-abc.jpg)");
if (b4[0].kind === "image") assert(b4[0].src === "/uploads/logo-abc.jpg", "yerel yol src");

process.exit(failures ? 1 : 0);
