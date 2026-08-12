# Makale içi görseller + medya kütüphanesi + görsel seçici — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Panel kullanıcısının makale metninin istediği yerine görsel ekleyebilmesini, medya bölümünden (toplu) yükleyebilmesini ve yüklenen her görseli tüm görsel alanlarında “Kütüphaneden seç” ile yeniden kullanabilmesini sağlamak.

**Architecture:** Görseller makale metnine mini-markdown satırı (`![alt](url)`) olarak gömülür; DB şeması değişmez. Ortak `parseBlocks`/`ProseText` (`src/lib/richtext.tsx`) bir `image` blok türü kazanır ve tüm render/edit yüzeyleri (hizmet, blog, içerik) bunu otomatik miras alır. Yeniden kullanılabilir bir `MediaPicker` modalı hem editöre hem tüm `Uploader` alanlarına bağlanır; medya sayfası toplu yükleyici alır.

**Tech Stack:** Next.js 16 (App Router, RSC, server actions), React 19.2, TypeScript 5.8, Tailwind CSS 4, `@vercel/blob` (prod) / yerel FS (dev), Prisma + PostgreSQL.

## Global Constraints

- **Test altyapısı YOK.** Doğrulama = `npm run lint` (0 hata) + `npm run build` (tip/derleme) + tarayıcı MCP (`preview_start name: safari-consulting`). Yeni test çatısı kurma.
- **DB canlıyla ORTAK.** Yerel `npm run dev` aynı Postgres'i kullanır → panelden DB'ye kayıt canlıyı etkiler. Doğrulamada DB'ye yazmaktan kaçın; yazman gerekiyorsa geçici bir test kaydı oluşturup **sonra sil/geri al**. Editörün canlı önizlemesi (client-side, kayıt yapmadan) tercih edilir.
- **Yerelde `BLOB_READ_WRITE_TOKEN` yok** → yüklemeler `public/uploads`'a düşer (canlı blob'dan ayrı). `listMedia` yerelde bu klasörü okur.
- **Blob store PUBLIC** (mevcut davranış korunur). Upload API tür/boyut kontrolleri değişmez: görsel ≤ 8 MB, video ≤ 50 MB, tür beyaz listesi.
- **CRLF:** `parseBlocks` metni `\r\n?` → `\n` normalize eder; yeni ayrıştırma bu normalizasyondan sonra çalışır.
- **`next/image` KULLANILMAZ** — proje `<img>` + `{/* eslint-disable-next-line @next/next/no-img-element */}` desenini kullanır. Aynısını sürdür.
- **Renk/paletler:** `forest`, `forest-deep`, `gold`, `gold-dark`, `ivory`, `sand`, `stone`, `ink`, `emerald` gibi mevcut Tailwind tema renklerini kullan (yeni renk tanımlama).
- **Dil:** Tüm panel metinleri Türkçe.
- Her görev kendi `npm run lint` + `npm run build` döngüsüyle biter ve ayrı commit alır.

---

## Dosya yapısı

**Yeni:**
- `src/lib/media.ts` — paylaşılan `listMedia()` + `MediaItem` tipi.
- `src/app/api/admin/media/route.ts` — `GET` medya listesi (JSON, oturum korumalı).
- `src/components/admin/MediaPicker.tsx` — seçici modal (mevcutları göster + yeni yükle).
- `src/components/admin/MediaUploader.tsx` — medya sayfası toplu/sürükle-bırak yükleyici.
- `scripts/check-richtext-images.ts` — `parseBlocks` görsel ayrıştırması için çalıştırılabilir doğrulama betiği.

**Değişir:**
- `src/lib/richtext.tsx` — `image` blok türü + ayrıştırma + `ProseText` render.
- `src/components/ArticleBody.tsx` — `image` blok render + eski `inlineImage` yalnızca yedek.
- `src/app/admin/(panel)/media/page.tsx` — `listMedia`'yı `@/lib/media`'dan al + `MediaUploader` ekle.
- `src/components/admin/Uploader.tsx` — “Kütüphaneden seç” düğmesi + `MediaPicker`.
- `src/components/admin/RichTextEditor.tsx` — “Görsel” düğmesi + `MediaPicker` + imlece ekleme.

**Değişmez:** `prisma/schema.prisma`, `deleteMediaAction`, `src/app/api/admin/upload/route.ts`, `inlineImages` haritası (`services/[slug]/page.tsx`).

---

### Task 1: Ortak render katmanında `image` blok türü

**Files:**
- Modify: `src/lib/richtext.tsx`
- Create (test): `scripts/check-richtext-images.ts`

**Interfaces:**
- Produces: `RichBlock` birliğine `{ kind: "image"; src: string; alt: string }` eklenir. `parseBlocks(text: string): RichBlock[]` artık kendi paragrafındaki `![alt](url)` satırını `image` bloğu olarak döner. `ProseText` `image` bloğunu `<figure>` çizer.

- [ ] **Step 1: Doğrulama betiğini yaz (failing test)**

`scripts/check-richtext-images.ts` oluştur:

```ts
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
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu doğrula**

Run: `npx tsx scripts/check-richtext-images.ts`
Expected: FAIL — “ikinci blok image” satırı FAIL verir (parseBlocks henüz image üretmez; `![...]` bloğu `para` olur).

- [ ] **Step 3: `parseBlocks`'a image ayrıştırması ekle**

`src/lib/richtext.tsx` içinde `RichBlock` birliğini güncelle:

```ts
export type RichBlock =
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "image"; src: string; alt: string }
  | { kind: "para"; text: string };
```

Dosyanın üstüne (import'lardan sonra) regex ekle:

```ts
/** A standalone image line: ![alt](url) as its own paragraph. */
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
```

`parseBlocks` içindeki `.map<RichBlock>((block) => { ... })` gövdesinde, `heading` kontrolünden hemen sonra image kontrolü ekle:

```ts
      if (block.startsWith("## ")) return { kind: "heading", text: block.slice(3).trim() };
      const img = block.match(IMAGE_RE);
      if (img) return { kind: "image", src: img[2], alt: img[1].trim() };
      const lines = block.split("\n");
```

(Geri kalan `quote`/`list`/`para` mantığı olduğu gibi kalır.)

- [ ] **Step 4: `ProseText`'e image render ekle**

`ProseText` içindeki `blocks.map((block, i) => { ... })` gövdesinde, `heading` kontrolünden önce (ya da ilk sırada) image render'ı ekle:

```tsx
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
```

`firstParaIdx` hesabı (`b.kind === "para"`) değişmeden kalır; image blokları paragraf sayılmaz, sorun yok.

- [ ] **Step 5: Doğrulama betiğini çalıştır, geçtiğini doğrula**

Run: `npx tsx scripts/check-richtext-images.ts`
Expected: PASS — tüm satırlar `ok:` ve çıkış kodu 0.

- [ ] **Step 6: Lint + build**

Run: `npm run lint`
Expected: 0 hata.
Run: `npm run build`
Expected: Başarılı derleme.

- [ ] **Step 7: Commit**

```bash
git add src/lib/richtext.tsx scripts/check-richtext-images.ts
git commit -m "feat(richtext): makale metninde satir ici gorsel blogu (image) destegi"
```

---

### Task 2: `ArticleBody` image bloklarını çizsin + eski görsel yalnızca yedek

**Files:**
- Modify: `src/components/ArticleBody.tsx`

**Interfaces:**
- Consumes: Task 1'den `parseBlocks` `image` blokları.
- Produces: Gövde bir veya daha çok `image` bloğu içeriyorsa `inlineImage` yedeği **gösterilmez**; içermiyorsa eski konumunda (2. başlıktan önce) gösterilir.

- [ ] **Step 1: `ArticleBody.tsx`'i güncelle**

Dosyanın tamamını şununla değiştir:

```tsx
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

  // If the body itself carries image blocks, the author is placing images
  // explicitly — the legacy single mid-article image is suppressed.
  const hasInlineImages = blocks.some((b) => b.kind === "image");

  // Legacy fallback: insert the hardcoded mid-article image just before the
  // 2nd heading, only when the body has no image blocks of its own.
  const headingIdx = blocks.map((b, i) => (b.kind === "heading" ? i : -1)).filter((i) => i >= 0);
  const legacyImageBefore = !hasInlineImages && inlineImage && headingIdx.length >= 2 ? headingIdx[1] : -1;

  const firstParaIdx = blocks.findIndex((b) => b.kind === "para");

  return (
    <div>
      {blocks.map((block, i) => {
        const nodes: React.ReactNode[] = [];

        if (i === legacyImageBefore && inlineImage) {
          nodes.push(
            <Reveal key={`legacy-img-${i}`}>
              <figure className="my-10 overflow-hidden rounded-xl border border-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inlineImage} alt={inlineAlt ?? ""} className="aspect-[3/2] w-full object-cover" />
              </figure>
            </Reveal>
          );
        }

        if (block.kind === "image") {
          nodes.push(
            <Reveal key={i}>
              <figure className="my-10 overflow-hidden rounded-xl border border-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} className="w-full" />
                {block.alt && (
                  <figcaption className="bg-ivory/60 px-4 py-2.5 text-xs text-stone">{block.alt}</figcaption>
                )}
              </figure>
            </Reveal>
          );
        } else if (block.kind === "heading") {
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
          const dropCap = i === firstParaIdx;
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
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı.

- [ ] **Step 3: Tarayıcıda doğrula (DB'ye yazmadan mümkün olduğunca)**

`preview_start` (`name: safari-consulting`) → `/admin` giriş (bkz. HANDOFF §4). Bir hizmet düzenle sayfasına git (ör. Mali Danışmanlık). Açıklama textarea'sına elle şu satırı ekle (kaydetmeden önce **Önizleme**'ye bas):

```
![Örnek grafik](/uploads/ornek.jpg)
```

Editör önizlemesinde (ProseText) figure görünmeli. **Public ArticleBody'yi görmek** istersen: geçici olarak kaydet, `/tr/services/<slug>` aç, doğrula, sonra eklediğin satırı geri al ve tekrar kaydet (DB ortak — temiz bırak). Alternatif: yeni geçici bir hizmet oluştur, doğrula, sil.
Beklenen: görsel bloğu figure olarak render olur; içinde görsel bloğu olmayan başka bir hizmet hâlâ eski sabit orta görseli gösterir.

- [ ] **Step 4: Commit**

```bash
git add src/components/ArticleBody.tsx
git commit -m "feat(article): govdedeki gorsel bloklarini ciz, eski orta gorseli yedege al"
```

---

### Task 3: Paylaşılan `listMedia` + medya listeleme API'si

**Files:**
- Create: `src/lib/media.ts`
- Modify: `src/app/admin/(panel)/media/page.tsx`
- Create: `src/app/api/admin/media/route.ts`

**Interfaces:**
- Produces: `listMedia(): Promise<MediaItem[]>` (`MediaItem = { url: string; name: string; size: number; date?: Date }`); `GET /api/admin/media` → `{ items: MediaItem[] }` (oturum yoksa 401).
- Consumes: mevcut `@vercel/blob` `list`, `getVerifiedSession` (`@/lib/auth`).

- [ ] **Step 1: `src/lib/media.ts` oluştur**

```ts
export type MediaItem = { url: string; name: string; size: number; date?: Date };

/** Lists uploaded media. Uses Vercel Blob in production, local FS in dev. */
export async function listMedia(): Promise<MediaItem[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "uploads/", limit: 200 });
      return blobs
        .map((b) => ({ url: b.url, name: b.pathname.split("/").pop() ?? b.pathname, size: b.size, date: b.uploadedAt }))
        .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
    } catch {
      return [];
    }
  }
  // local dev fallback
  try {
    const { readdir, stat } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads");
    const files = await readdir(dir).catch(() => [] as string[]);
    const items: MediaItem[] = [];
    for (const f of files) {
      if (f.startsWith(".")) continue;
      const s = await stat(path.join(dir, f));
      items.push({ url: `/uploads/${f}`, name: f, size: s.size, date: s.mtime });
    }
    return items.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: `media/page.tsx`'i paylaşılan `listMedia`'yı kullanacak şekilde güncelle**

`src/app/admin/(panel)/media/page.tsx` başındaki `type Item = ...` satırını ve yerel `async function listMedia(): Promise<Item[]> { ... }` fonksiyonunu **sil**. Bunun yerine import ekle:

```ts
import { PageHeader, EmptyState } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AdminIcon from "@/components/admin/icons";
import { deleteMediaAction } from "../../actions";
import { listMedia } from "@/lib/media";
```

`isVideo` ve `kb` yardımcıları ile `export default async function MediaPage()` gövdesi (grid/EmptyState) aynen kalır — `const items = await listMedia();` çağrısı artık lib'den gelir.

- [ ] **Step 3: `src/app/api/admin/media/route.ts` oluştur**

```ts
import { NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/auth";
import { listMedia } from "@/lib/media";

export async function GET() {
  const session = await getVerifiedSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await listMedia();
  return NextResponse.json({ items });
}
```

- [ ] **Step 4: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı.

- [ ] **Step 5: Tarayıcıda doğrula**

Giriş yaptıktan sonra tarayıcıda `/api/admin/media`'ya git → `{ "items": [...] }` JSON dönmeli (giriş yoksa `{"error":"unauthorized"}` 401). `/admin/media` sayfası eskisi gibi listeyi göstermeli.

- [ ] **Step 6: Commit**

```bash
git add src/lib/media.ts "src/app/admin/(panel)/media/page.tsx" src/app/api/admin/media/route.ts
git commit -m "feat(media): paylasilan listMedia + GET /api/admin/media uc noktasi"
```

---

### Task 4: `MediaPicker` seçici modal bileşeni

**Files:**
- Create: `src/components/admin/MediaPicker.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/media` (Task 3), `POST /api/admin/upload` (mevcut).
- Produces: `<MediaPicker open={boolean} onClose={() => void} onSelect={(url: string) => void} accept?={string} />`. Bir öğe seçilince `onSelect(url)` + `onClose()` çağrılır. Modal içinde “Yeni yükle” yükleme yapıp seçili sayar.

- [ ] **Step 1: `MediaPicker.tsx` oluştur**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AdminIcon from "./icons";

type MediaItem = { url: string; name: string; size: number };

const isVideo = (u: string) => /\.(mp4|webm|mov)$/i.test(u);

export default function MediaPicker({
  open,
  onClose,
  onSelect,
  accept = "image/*",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onlyImages = accept.includes("image") && !accept.includes("video");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http"))))
      .then((d: { items: MediaItem[] }) => setItems(d.items ?? []))
      .catch(() => setError("Medya listesi yüklenemedi."))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const visible = onlyImages ? items.filter((i) => !isVideo(i.url)) : items;

  async function handleUpload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      const data = (await res.json()) as { url: string };
      onSelect(data.url);
      onClose();
    } catch {
      setError("Yükleme başarısız oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-forest-deep/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-sand bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-sand px-5 py-3.5">
          <h2 className="text-sm font-semibold text-forest">Medya kütüphanesi</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3 py-1.5 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="download" className="h-4 w-4" /> Yeni yükle
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Kapat"
              className="grid h-8 w-8 place-items-center rounded-md text-stone transition-colors hover:bg-ivory"
            >
              <AdminIcon name="x" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />

        <div className="min-h-40 flex-1 overflow-y-auto p-5">
          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
          {loading ? (
            <p className="py-10 text-center text-sm text-stone/60">Yükleniyor…</p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone/60">Henüz görsel yok. “Yeni yükle” ile ekleyebilirsiniz.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {visible.map((item) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => { onSelect(item.url); onClose(); }}
                  className="group overflow-hidden rounded-lg border border-sand bg-ivory transition-colors hover:border-gold"
                  title={item.name}
                >
                  <span className="block aspect-[4/3] w-full">
                    {isVideo(item.url) ? (
                      <video src={item.url} className="h-full w-full object-cover" muted />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-left text-[10px] text-stone">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-forest">Yükleniyor…</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı (bileşen henüz kullanılmıyor; sadece derlenir).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/MediaPicker.tsx
git commit -m "feat(media): yeniden kullanilabilir MediaPicker secici modal"
```

---

### Task 5: `Uploader`'a “Kütüphaneden seç” düğmesi

**Files:**
- Modify: `src/components/admin/Uploader.tsx`

**Interfaces:**
- Consumes: `MediaPicker` (Task 4).
- Produces: Uploader kullanan tüm alanlar (hizmet banner'ı, referans logosu, blog kapağı, ayarlar logo/favicon) artık kütüphaneden seçebilir. Dış API (`name`, `defaultValue`, `accept`, `label`, `aspect`) değişmez.

- [ ] **Step 1: `Uploader.tsx`'i güncelle**

Dosyanın tamamını şununla değiştir (mevcut mantık korunur, `MediaPicker` state + düğme eklenir):

```tsx
"use client";

import { useRef, useState } from "react";
import AdminIcon from "./icons";
import MediaPicker from "./MediaPicker";

export default function Uploader({
  name,
  defaultValue = "",
  accept = "image/*",
  label = "Görsel",
  aspect = "aspect-[16/9]",
}: {
  name: string;
  defaultValue?: string;
  accept?: string;
  label?: string;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = accept.includes("video") || /\.(mp4|webm|mov)$/i.test(value);

  async function handleFile(file: File) {
    setError(null);
    const maxMb = accept.includes("video") ? 50 : 8;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Dosya çok büyük (en fazla ${maxMb} MB).`);
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      const data = (await res.json()) as { url: string };
      setValue(data.url);
    } catch {
      setError("Yükleme başarısız oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-start gap-4">
        <div className={`relative ${aspect} w-40 shrink-0 overflow-hidden rounded-lg border border-sand bg-ivory`}>
          {value ? (
            isVideo ? (
              <video src={value} className="h-full w-full object-cover" muted loop playsInline autoPlay />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-stone/40">
              <AdminIcon name="image" className="h-8 w-8" />
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-forest-deep/50 text-ivory">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3.5 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="download" className="h-4 w-4" />
              {value ? `${label} değiştir` : `${label} yükle`}
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-sand px-3.5 py-2 text-xs font-medium text-forest transition-colors hover:border-gold/60"
            >
              <AdminIcon name="grid" className="h-4 w-4" /> Kütüphaneden seç
            </button>
            {value && (
              <button type="button" onClick={() => setValue("")} className="text-xs text-red-500 hover:underline">
                Kaldır
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {value && <p className="mt-2 break-all text-[11px] text-stone/70">{value}</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <p className="mt-2 text-[11px] text-stone/60">Veya doğrudan bir URL yapıştırabilirsiniz:</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/images/... veya https://..."
            className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2 text-xs text-ink outline-none focus:border-gold"
          />
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => setValue(url)}
        accept={accept}
      />
    </div>
  );
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı.

- [ ] **Step 3: Tarayıcıda doğrula (DB'ye yazmadan)**

Bir hizmet düzenle sayfasında “Görsel (kart ve detay banner'ı)” alanında **Kütüphaneden seç** → modal açılır, mevcut görseller listelenir. Bir görsel seç → önizleme ve alttaki URL alanı seçilen URL ile dolar. Kaydetme gerekmez (sadece client state doğrulanır).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/Uploader.tsx
git commit -m "feat(uploader): tum gorsel alanlarina 'Kutuphaneden sec' dugmesi"
```

---

### Task 6: `RichTextEditor`'a “Görsel” düğmesi + imlece ekleme

**Files:**
- Modify: `src/components/admin/RichTextEditor.tsx`

**Interfaces:**
- Consumes: `MediaPicker` (Task 4).
- Produces: Editör araç çubuğunda “Görsel ekle” düğmesi; seçilen görsel imlecin olduğu yere `\n\n![alt](url)\n\n` olarak eklenir. Hizmet/blog/içerik editörlerinin hepsi otomatik kazanır.

- [ ] **Step 1: `RichTextEditor.tsx`'i güncelle**

Dosyanın tamamını şununla değiştir (mevcut araçlar korunur; import, state, `insertAtCursor`/`insertImage`, görsel düğmesi ve `MediaPicker` eklenir):

```tsx
"use client";

import { useRef, useState } from "react";
import AdminIcon from "./icons";
import MediaPicker from "./MediaPicker";
import { ProseText } from "@/lib/richtext";

type Tool = { key: string; label: string; icon?: string; title: string };

const tools: Tool[] = [
  { key: "bold", label: "B", title: "Kalın" },
  { key: "italic", label: "I", title: "İtalik" },
  { key: "heading", label: "H", title: "Ara başlık" },
  { key: "quote", label: "❝", title: "Alıntı" },
  { key: "list", label: "•", title: "Madde listesi" },
];

export default function RichTextEditor({
  name,
  defaultValue,
  rows = 8,
  hint,
}: {
  name: string;
  defaultValue: string;
  rows?: number;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const surround = (before: string, after: string, placeholder: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || placeholder;
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  };

  const prefixLines = (prefix: string) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const prefixed = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => ta.focus());
  };

  const insertAtCursor = (snippet: string) => {
    const ta = ref.current;
    if (!ta) {
      setValue((v) => v + snippet);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.slice(0, start) + snippet + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    });
  };

  const insertImage = (url: string) => {
    const alt =
      url.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() ?? "";
    insertAtCursor(`\n\n![${alt}](${url})\n\n`);
  };

  const apply = (key: string) => {
    switch (key) {
      case "bold":
        return surround("**", "**", "kalın metin");
      case "italic":
        return surround("*", "*", "italik metin");
      case "heading":
        return prefixLines("## ");
      case "quote":
        return prefixLines("> ");
      case "list":
        return prefixLines("- ");
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-sand bg-white focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
      <div className="flex items-center gap-1 border-b border-sand bg-ivory/60 px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.title}
            onClick={() => apply(t.key)}
            className={`grid h-7 w-7 place-items-center rounded text-stone transition-colors hover:bg-white hover:text-forest ${
              t.key === "bold" ? "font-bold" : t.key === "italic" ? "font-serif italic" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-sand" aria-hidden="true" />
        <button
          type="button"
          title="Görsel ekle"
          onClick={() => setPickerOpen(true)}
          className="grid h-7 w-7 place-items-center rounded text-stone transition-colors hover:bg-white hover:text-forest"
        >
          <AdminIcon name="image" className="h-4 w-4" />
        </button>
        <span className="ml-auto">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${
              preview ? "bg-forest text-ivory" : "text-stone hover:bg-white hover:text-forest"
            }`}
          >
            <AdminIcon name="eye" className="h-3.5 w-3.5" />
            Önizleme
          </button>
        </span>
      </div>

      {/* the actual submitted value */}
      <textarea ref={ref} name={name} hidden={preview} value={value} onChange={(e) => setValue(e.target.value)} rows={rows} className="w-full resize-y bg-white px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-ink outline-none" />

      {preview && (
        <div className="min-h-24 px-4 py-3 text-sm text-ink">
          {value.trim() ? <ProseText text={value} lead /> : <p className="text-stone/50">Önizlenecek içerik yok.</p>}
        </div>
      )}

      {hint && <p className="border-t border-sand bg-ivory/40 px-3 py-1.5 text-[11px] text-stone/70">{hint}</p>}

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={insertImage} accept="image/*" />
    </div>
  );
}
```

- [ ] **Step 2: Editör hint metinlerini görseli anacak şekilde güncelle**

Aşağıdaki üç yerdeki `hint` metnine görsel ekleme ibaresi ekle (mevcut metnin sonuna ` · görsel` gelecek şekilde):

`src/app/admin/(panel)/services/[id]/page.tsx` içinde:
```
hint="Araç çubuğu: kalın · italik · ara başlık · alıntı · liste · görsel. Boş satır yeni paragraf açar."
```
`src/app/admin/(panel)/posts/[id]/page.tsx` içinde:
```
hint="Araç çubuğu: kalın · italik · ara başlık · alıntı · liste · görsel. Boş satır yeni paragraf açar."
```
`src/components/admin/ContentEditor.tsx` içinde `richHint` sabitini:
```
const richHint = 'Kalın · italik · ara başlık · alıntı · liste · görsel araç çubuğunu kullanabilirsiniz.';
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı.

- [ ] **Step 4: Tarayıcıda doğrula (DB'ye yazmadan)**

Bir hizmet düzenle sayfasında açıklama editöründe araç çubuğundaki **görsel ikonuna** bas → `MediaPicker` açılır. Bir görsel seç → textarea'da imlecin olduğu yere `![...](url)` satırı eklenir. **Önizleme**'ye bas → görsel figure olarak görünür. (Kaydetme gerekmez.)

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/RichTextEditor.tsx "src/app/admin/(panel)/services/[id]/page.tsx" "src/app/admin/(panel)/posts/[id]/page.tsx" src/components/admin/ContentEditor.tsx
git commit -m "feat(editor): araç cubuguna 'Gorsel ekle' + imlece markdown ekleme"
```

---

### Task 7: Medya kütüphanesinde toplu/sürükle-bırak yükleme

**Files:**
- Create: `src/components/admin/MediaUploader.tsx`
- Modify: `src/app/admin/(panel)/media/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/upload` (mevcut), `useRouter().refresh()` (App Router).
- Produces: `<MediaUploader />` — sürükle-bırak + çoklu dosya; her dosyayı ayrı yükler, dosya-başı durum gösterir, bitince listeyi tazeler.

- [ ] **Step 1: `MediaUploader.tsx` oluştur**

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminIcon from "./icons";

type Status = "pending" | "uploading" | "done" | "error";
type Job = { name: string; status: Status };

export default function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function uploadOne(file: File, idx: number) {
    setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "uploading" } : x)));
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      if (!res.ok) throw new Error("upload_failed");
      setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "done" } : x)));
    } catch {
      setJobs((j) => j.map((x, i) => (i === idx ? { ...x, status: "error" } : x)));
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const startIdx = jobs.length;
    setJobs((j) => [...j, ...arr.map((f) => ({ name: f.name, status: "pending" as Status }))]);
    await Promise.all(arr.map((f, k) => uploadOne(f, startIdx + k)));
    router.refresh();
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors ${
          dragOver ? "border-gold bg-gold/5" : "border-sand bg-white hover:border-gold/50"
        }`}
      >
        <AdminIcon name="download" className="h-6 w-6 text-forest" />
        <p className="mt-2 text-sm text-ink">Dosyaları buraya sürükleyin ya da tıklayıp seçin</p>
        <p className="mt-1 text-[11px] text-stone/60">Aynı anda birden çok görsel/video yüklenebilir (görsel ≤ 8 MB, video ≤ 50 MB).</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {jobs.map((j, i) => (
            <li key={`${j.name}-${i}`} className="flex items-center justify-between rounded-md border border-sand bg-white px-3 py-1.5 text-xs">
              <span className="truncate text-ink">{j.name}</span>
              <span
                className={
                  j.status === "done"
                    ? "text-emerald"
                    : j.status === "error"
                    ? "text-red-600"
                    : "text-stone"
                }
              >
                {j.status === "done"
                  ? "Yüklendi"
                  : j.status === "error"
                  ? "Hata"
                  : j.status === "uploading"
                  ? "Yükleniyor…"
                  : "Bekliyor"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `media/page.tsx`'e `MediaUploader`'ı ekle**

`src/app/admin/(panel)/media/page.tsx` içinde import ekle:
```ts
import MediaUploader from "@/components/admin/MediaUploader";
```
`return (...)` içinde `<PageHeader ... />`'dan hemen sonra `<MediaUploader />` ekle:
```tsx
      <PageHeader title="Medya Kütüphanesi" description="Panelden yüklenen görsel ve videolar. Kullanılmayanları buradan silebilirsiniz." />

      <MediaUploader />

      {items.length === 0 ? (
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint` → 0 hata.
Run: `npm run build` → başarılı.

- [ ] **Step 4: Tarayıcıda doğrula**

`/admin/media` sayfasına git. Sürükle-bırak alanına 2-3 görseli bırak (ya da tıklayıp çoklu seç). Her dosya için durum “Yükleniyor… → Yüklendi” olmalı; bitince liste tazelenip yeni öğeler görünmeli. (Yerelde dosyalar `public/uploads`'a düşer, canlı blob'a değil.) Test için yüklediklerini kart üzerindeki çöp kutusuyla silerek temiz bırak.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/MediaUploader.tsx "src/app/admin/(panel)/media/page.tsx"
git commit -m "feat(media): toplu/surukle-birak yukleme (MediaUploader)"
```

---

## Uygulama sonrası (tüm görevler bitince)

- [ ] `docs/HANDOFF.md`'yi güncelle: §8'deki “Makale-içi görseller” maddesini kapat, yeni yetenekleri (makale içi çoklu görsel, medya toplu yükleme, kütüphaneden seç) §6/§7'ye ekle.
- [ ] Canlıya deploy kullanıcı onayıyla: `npx vercel deploy --prod --yes` (DB şeması değişmedi). Deploy öncesi build + 3 dilde bir hizmet + blog sayfası göz kontrolü.

## Doğrulama özeti (kabul kriterleri)

1. Hizmet editöründe metne 2 görsel ekle → kaydet → `/tr/services/<slug>`'de iki görsel de doğru sırada, kırpılmadan görünür.
2. Gövdesinde görsel olmayan eski bir hizmet → eski sabit orta görsel hâlâ görünür (yedek).
3. `/admin/media`'da çoklu dosya sürükle-bırak → hepsi yüklenir, liste tazelenir.
4. Referans logosu / blog kapağı / ayarlar logo alanında “Kütüphaneden seç” → önceki yükleme seçilebilir.
5. Blog yazısı gövdesine görsel → `/tr/blog/<slug>`'de görünür.
6. `npm run lint` = 0, `npm run build` başarılı, konsol/sunucu hatasız.
