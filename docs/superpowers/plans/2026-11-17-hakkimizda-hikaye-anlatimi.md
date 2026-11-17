# Hakkımızda Hikâye Anlatımı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hakkımızda sayfasındaki 7 paragraflık anlatıyı, metnin tek kelimesini kaybetmeden, ana sayfadaki hikâye bölümünün diliyle sahnelemek.

**Architecture:** Yeni `StoryScroll` istemci bileşeni; açık zeminde metin solda akar, sağda `xl`'den itibaren yapışkan bir fotoğraf paneli durur. Panel, depodaki mevcut `useScrollStage` (rAF) kancasıyla sürülür: etkin sahne çapraz geçişle değişir, altın çubuk sürekli dolar. Sahne görselleri `Setting` tablosundan gelir, boşsa varsayılana düşer. Sahne çözümleme ve mobil şerit yerleşimi saf fonksiyonlar olarak ayrı bir modülde durur ve script ile test edilir.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, Prisma/PostgreSQL, `tsx` ile çalışan kontrol scriptleri.

**Spec:** `docs/superpowers/specs/2026-11-17-hakkimizda-hikaye-anlatimi-design.md`

## Global Constraints

- Metnin hiçbir bloğu düşürülmez; `para`, `heading`, `quote`, `list` render edilir, `image` sahne havuzuna gider.
- Satır içi işaretler `renderInline` ile çözülür (`**kalın**` yıldızlı görünmemeli).
- Yapışkan iki sütun **yalnızca `xl` ve üzeri** (≥1280). `xl` altı tek sütun + şeritler.
- Bölüm zemini **açık** (sayfanın fildişi zemini); koyu kütle yalnızca fotoğraf panelinden gelir.
- Yeni i18n dizesi eklenmez: `t.about.story_kicker`, `t.about.story_title`, `t.story.chapter` kullanılır.
- Yeni video varlığı eklenmez.
- `prefers-reduced-motion` altında geçiş ve ken-burns kapanır.
- Yapışkan panel navigasyonun altında kalır (nav yüksekliği 73px).
- Projede React test altyapısı **yok**; saf mantık `scripts/check-*.ts` desenindeki scriptlerle, görsel/düzen davranışı tarayıcıda doğrulanır.
- Çalışma dalı `claude/hakkimizda-metni` (PR #8).

## Review Focus

- **`about_body` boş veya eksik** → bölüm çökmemeli, başlık görünüp gövde boş kalmalı. (Task 1 testi + Task 2 tarayıcı adımı)
- **Paragraf sayısı sahne sayısından az** (panelden metin kısaltılırsa) → şerit indeksleri aralık dışına taşmamalı. (Task 1 testi)
- **Ayar alanı boş veya yalnızca boşluk** → kırık `img` yerine varsayılana düşmeli. (Task 1 testi)
- **Gövdede kalın işareti, başlık veya liste** → doğru render edilmeli, ekranda yıldızlı metin çıkmamalı. (Task 2 tarayıcı adımı)
- **`prefers-reduced-motion` açık** → çapraz geçiş ve ken-burns kapanmalı. (Task 2 tarayıcı adımı)

---

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/lib/storyScenes.ts` *(yeni)* | Saf mantık: sahne URL çözümleme + mobil şerit indeksleri |
| `scripts/check-story-scenes.ts` *(yeni)* | `storyScenes` davranış testleri |
| `src/components/StoryScroll.tsx` *(yeni)* | Anlatı bileşeni: düzen, çapraz geçiş, bölüm numarası, ilerleme çubuğu |
| `src/app/[locale]/about/page.tsx` *(değişir)* | Eski "Story narrative" bölümünün yerine `StoryScroll` |
| `src/app/admin/(panel)/settings/page.tsx` *(değişir)* | 4 sahne görseli alanı |
| `src/app/admin/actions.ts` *(değişir)* | 4 yeni anahtar `plainKeys` listesine |
| `README.md` *(değişir)* | Yeni ayar anahtarlarının belgelenmesi |

---

### Task 1: Sahne çözümleme ve şerit yerleşimi (saf mantık)

**Files:**
- Create: `src/lib/storyScenes.ts`
- Test: `scripts/check-story-scenes.ts`

**Interfaces:**
- Consumes: yok
- Produces:
  - `DEFAULT_SCENES: readonly string[]` — 4 varsayılan görsel yolu
  - `resolveScenes(settings: Record<string, string>, bodyImages?: string[]): string[]`
  - `bandIndices(paragraphCount: number, sceneCount: number): number[]`

- [ ] **Step 1: Write the failing test**

`scripts/check-story-scenes.ts`, `scripts/check-social-url.ts` desenini izler (console çıktısı + `process.exit(failures ? 1 : 0)`). Kapsanacak durumlar:

```ts
// resolveScenes
expectScenes({}, undefined, DEFAULT_SCENES);                      // hepsi bos -> varsayilan
expectScenes({ about_scene_2: "/u/a.jpg" }, undefined,
  [DEFAULT_SCENES[0], "/u/a.jpg", DEFAULT_SCENES[2], DEFAULT_SCENES[3]]);
expectScenes({ about_scene_1: "   " }, undefined, DEFAULT_SCENES); // bosluk -> varsayilan
expectScenes({}, ["/u/b.jpg"], [...DEFAULT_SCENES, "/u/b.jpg"]);   // govde gorseli havuza eklenir

// bandIndices
expectBands(7, 4, [0, 2, 4, 6]);   // asil durum
expectBands(3, 4, [0, 1, 2]);      // paragraf sahneden az -> tasma yok
expectBands(10, 4, [0, 3, 6, 9]);
expectBands(1, 4, [0]);
expectBands(0, 4, []);             // bos govde
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/check-story-scenes.ts`
Expected: FAIL — `Cannot find module '../src/lib/storyScenes'`

- [ ] **Step 3: Implement `src/lib/storyScenes.ts`**

`DEFAULT_SCENES` spec'teki dört yol, sırasıyla:
`/images/services/sirket-kurulusu.jpg`, `/images/about.jpg`,
`/images/services/ticaret-is-gelistirme.jpg`, `/images/heroes/services.jpg`.

`resolveScenes`: `about_scene_1..4` anahtarlarını sırayla okur, `trim()` sonrası boşsa o slot için `DEFAULT_SCENES[i]`; ardından `bodyImages` sona eklenir.

`bandIndices`: `grup = max(1, ceil(paragraphCount / sceneCount))`; `0, grup, 2*grup, …` üretir, `paragraphCount`'u aşanları atar, en çok `sceneCount` eleman döndürür.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/check-story-scenes.ts`
Expected: PASS — "hata yok", çıkış kodu 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/storyScenes.ts scripts/check-story-scenes.ts
git commit -m "feat(about): sahne cozumleme ve serit yerlesimi mantigi"
```

---

### Task 2: `StoryScroll` bileşeni

**Files:**
- Create: `src/components/StoryScroll.tsx`

**Interfaces:**
- Consumes: `bandIndices` (Task 1); `useScrollStage` (`src/lib/useScrollProgress.ts`); `renderInline`, `RichBlock` (`src/lib/richtext.tsx`)
- Produces:
  ```ts
  export default function StoryScroll(props: {
    blocks: RichBlock[];
    scenes: string[];
    kicker: string;
    title: string;
    chapterLabel: string;
  }): JSX.Element
  ```

- [ ] **Step 1: Implement the component**

`"use client"`. `useScrollStage<HTMLDivElement>(scenes.length, onFrame)` ile etkin sahne ve sürekli ilerleme alınır; ilerleme çubuğu `onFrame` içinde ref üzerinden `scaleY` ile sürülür (React state'i her karede güncellenmez).

Blok render: `para` → paragraf, `heading` → sakin ara başlık, `quote` → altın çizgili alıntı, `list` → altın kare imli liste. Hepsinde metin `renderInline`'dan geçer. `image` blokları gövdede render **edilmez** (sahneye sayfa tarafından taşınır).

Düzen: dış sarmalayıcı `grid xl:grid-cols-[1fr_minmax(0,520px)] xl:gap-16`. Panel `xl:sticky` ve nav'ın (73px) altında kalacak bir `top` değeriyle. Panel içinde üst üste görsel katmanları (etkin opak, diğerleri saydam, `transition-opacity`), köşede Playfair bölüm numarası (orman yeşili, düşük opaklık), meta etiket `${kicker} · ${chapterLabel} ${n} — ${toplam}`, ve ince altın dikey çubuk.

`xl` altı: panel gizlenir; `bandIndices(paraSayısı, scenes.length)` ile hesaplanan paragraf indekslerinin önüne tam genişlikte görsel şeridi eklenir.

Geçiş ve ken-burns `motion-reduce:` varyantlarıyla kapatılır.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: çıkış kodu 0

- [ ] **Step 3: Commit**

```bash
git add src/components/StoryScroll.tsx
git commit -m "feat(about): StoryScroll anlati bileseni"
```

---

### Task 3: Hakkımızda sayfası entegrasyonu

**Files:**
- Modify: `src/app/[locale]/about/page.tsx` (mevcut "Story narrative" bölümü)
- Revert: commit `83f2df6`

**Interfaces:**
- Consumes: `StoryScroll` (Task 2); `resolveScenes` (Task 1); `parseBlocks` (`src/lib/richtext.tsx`); `getSettings` (`src/lib/content.ts`)
- Produces: yok

- [ ] **Step 1: Revert the superseded sticky commit**

```bash
git revert --no-edit 83f2df6
```

- [ ] **Step 2: Replace the section**

Eski iki sütunlu grid + görsel kolajı tamamen kaldırılır. Sayfa `getSettings()` çağırır (zaten `Promise.all` içinde diğer veriler çekiliyor, oraya eklenir), gövdeyi ayrıştırır ve bölümü render eder:

```ts
const blocks = parseBlocks(content.about_body ?? "");
const bodyImages = blocks.filter((b) => b.kind === "image").map((b) => b.src);
const scenes = resolveScenes(settings, bodyImages);
```

`StoryScroll`'a `blocks`, `scenes`, `kicker={t.about.story_kicker}`, `title={t.about.story_title}`, `chapterLabel={t.story.chapter}` geçirilir.

- [ ] **Step 3: Build and lint**

Run: `npm run build` (sunucu kapalıyken; açıksa `prisma generate` EPERM verir ve `next build` hiç çalışmaz), ardından `npx eslint` ve `npx tsc --noEmit`
Expected: üçü de çıkış kodu 0, build logunda `EPERM` yok

- [ ] **Step 4: Verify in the browser**

`.env` ana depodan worktree'ye kopyalanır (commit edilmez), `npm run start` ile üretim sunucusu açılır. Doğrulanacaklar:

- `/tr/hakkimizda`, `/en/about`, `/ru/o-nas` → her birinde **7 paragraf** DOM'da sayılır
- 1440 ve 1280 → iki sütun, panel yapışkan, üst kenarı nav'ın (73px) altında
- 1024 ve 375 → tek sütun, şeritler paragraf aralarında, yatay kaydırma yok
- Kaydırırken sahne değişiyor ve altın çubuk **sürekli** doluyor
- `prefers-reduced-motion` açıkken geçiş yok
- Konsol hatası yok

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/about/page.tsx"
git commit -m "feat(about): anlati bolumunu StoryScroll ile degistir"
```

---

### Task 4: Panelden sahne görseli yönetimi

**Files:**
- Modify: `src/app/admin/actions.ts:575-595` (`plainKeys`)
- Modify: `src/app/admin/(panel)/settings/page.tsx` ("Marka & SEO" sekmesi, `site_logo` alanının bulunduğu `AdminCard`)
- Modify: `README.md`

**Interfaces:**
- Consumes: `resolveScenes` anahtar adları (Task 1): `about_scene_1` … `about_scene_4`
- Produces: yok

- [ ] **Step 1: Allow the new keys**

`plainKeys` dizisine `"about_scene_1"`, `"about_scene_2"`, `"about_scene_3"`, `"about_scene_4"` eklenir. Bu olmadan form alanları sessizce yok sayılır.

- [ ] **Step 2: Add the four picker fields**

Ayarlar sayfasına, `site_logo` ile aynı desende yeni bir `AdminCard` ("Hakkımızda sahne görselleri") eklenir; dört alan:

```tsx
<Uploader name="about_scene_1" defaultValue={s.about_scene_1 ?? ""} label="Sahne 1" aspect="aspect-[4/5]" />
```

`aspect-[4/5]` panelin dikey oranını yansıtır. Her alanın altına anlatıdaki yerini söyleyen kısa bir ipucu yazılır (kuruluş / stratejiye geçiş / ortaklıklar / vizyon).

- [ ] **Step 3: Verify end to end**

Panelden Sahne 2'ye kütüphaneden bir görsel seçilip kaydedilir; `/tr/hakkimizda` yenilenince ikinci sahnenin değiştiği, alan boşaltılınca varsayılana döndüğü görülür. (Sayfalar `force-dynamic`, deploy gerekmez.)

- [ ] **Step 4: Document the keys**

`README.md` içindeki yönetim paneli bölümüne, dört anahtarın ne işe yaradığı ve boş bırakılınca varsayılana düşüldüğü bir satırla eklenir.

- [ ] **Step 5: Build, lint, commit**

Run: `npm run build`, `npx eslint`, `npx tsc --noEmit` → üçü de 0

```bash
git add src/app/admin/actions.ts "src/app/admin/(panel)/settings/page.tsx" README.md
git commit -m "feat(admin): Hakkimizda sahne gorselleri icin dort ayar alani"
```

---

## Teslim

Dört görev bittiğinde PR #8 şunları taşır: onaylı metin + uygulama scripti, tasarım dokümanı, bu plan, `StoryScroll` ve panel alanları. Yapışkan düzeltme commit'i geri alınmış olur.

Metin zaten canlıda; **kod** değişikliğinin yayına girmesi için ana depodan `npx vercel deploy --prod --yes` gerekir. Deploy kararı kullanıcınındır.
