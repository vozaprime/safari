# Veri katmanı önbelleği — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public sayfaların veritabanı okumalarını `unstable_cache` ile önbellekleyip aylık Prisma işlem sayısını Free planın 200.000'inin çok altına indirmek.

**Architecture:** `src/lib/content.ts` içindeki okumalar etiketli `unstable_cache` sarmalayıcılarına alınır. Ziyaretçi girdisinden gelen anahtarlar (slug, sayfa numarası) önbelleğin **dışında** doğrulanıp sınırlanır, böylece bot taraması ne sorgu ne önbellek girdisi üretir. Panelin içerik yazan server action'ları `revalidateTag` çağırır; mevcut `revalidatePath` çağrıları korunur.

**Tech Stack:** Next.js 16.4.6 (`cacheComponents` kapalı), Prisma 6.19.3, TypeScript, `tsx` ile çalışan `scripts/check-*.ts` testleri.

**Spec:** `docs/superpowers/specs/2026-11-25-veri-katmani-onbellegi-design.md`

## Global Constraints

- Beş etiket, başkası yok: `settings`, `page-content`, `services`, `references`, `posts`
- Bütün önbellek sarmalayıcıları `revalidate: 86400` kullanır
- Mevcut `revalidatePath("/", "layout")` çağrıları **silinmez**
- `getSettingsUncached()` tek tüketicisi `src/lib/mail.ts` olmak zorunda
- Panel okumaları (`src/app/admin/**`) önbelleklenmez
- Veritabanı kapalı: doğrulama `tsx` testleri + `tsc --noEmit` + eslint + `npm run build` ile sınırlı
- Hiçbir test gerçek bağlantı dizesi kullanmaz, hiçbir kod yolu dizeyi loglamaz
- Yorumlar ve test adları Türkçe (proje biçimi)

## Review Focus

- **Dil değiştirici:** `resolveServiceSlug(locale, slug)` başka bir dilin slug'ıyla çağrılır; slug kontrolü yalnızca hedef dile bakarsa dil değiştirme kırılır → Task 1 + Task 2
- **`?page=` uç değerleri:** `0`, `-3`, `2.7`, `999999`, `NaN` → hepsi gerçek bir sayfaya kırpılmalı, ayrı önbellek anahtarı üretmemeli → Task 1
- **Çevirisi olmayan içerik:** o dilde başlığı boş hizmet/yazı → slug haritasında yok, `null` dönmeli (bugünkü davranıştan sapma, bilinçli) → Task 1 + Task 2
- **Etiket yazım hatası:** sabit yerine düz string kullanılırsa `revalidateTag` sessizce hiçbir şeyi temizlemez → Task 2 + Task 4
- **Sonradan eklenen okuma/action:** yeni bir okuma sarmalanmazsa veya yeni bir içerik action'ı etiket temizlemezse fark edilmez → Task 2 + Task 4

---

### Task 1: Saf anahtar yardımcıları

**Files:**
- Create: `src/lib/contentKeys.ts`
- Test: `scripts/check-content-keys.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/i18n`
- Produces:
  - `clampPage(page: number, totalItems: number, perPage: number): number`
  - `slugIsKnown(entries: Partial<Record<Locale, string>>[], locale: Locale, slug: string): boolean`
  - `slugIsKnownInAnyLocale(entries: Partial<Record<Locale, string>>[], slug: string): boolean`

`entries` tipi `getAllLocalizedSlugs()`'un döndürdüğü `services` / `posts` dizilerinin eleman tipidir (`alternatesFrom` çıktısı).

- [ ] **Step 1: Testi yaz** — `scripts/check-content-keys.ts`, projedeki `check-story-scenes.ts` biçiminde (sayaçlı `expect`, sonda `process.exit(failures ? 1 : 0)`).

`clampPage` beklentileri (`perPage = 9`):

```ts
expect(clampPage(1, 13, 9), 1, "gecerli ilk sayfa korunur");
expect(clampPage(2, 13, 9), 2, "gecerli son sayfa korunur");
expect(clampPage(0, 13, 9), 1, "sifir 1'e cekilir");
expect(clampPage(-3, 13, 9), 1, "negatif 1'e cekilir");
expect(clampPage(2.7, 13, 9), 2, "ondalik asagi yuvarlanir");
expect(clampPage(999999, 13, 9), 2, "aralik disi son sayfaya kirpilir");
expect(clampPage(NaN, 13, 9), 1, "NaN 1'e cekilir");
expect(clampPage(1, 0, 9), 1, "hic yazi yoksa 1 doner (sifira bolme yok)");
```

Slug beklentileri (`entries = [{ tr: "sirket-kurulusu", en: "company-formation" }, { tr: "ticaret" }]`):

```ts
expect(slugIsKnown(entries, "tr", "sirket-kurulusu"), true, "dogru dildeki slug taninir");
expect(slugIsKnown(entries, "en", "sirket-kurulusu"), false, "baska dilin slug'i o dilde taninmaz");
expect(slugIsKnown(entries, "ru", "sirket-kurulusu"), false, "cevirisi olmayan dil icin false");
expect(slugIsKnown(entries, "tr", "yok-boyle-bir-sey"), false, "bilinmeyen slug false");
expect(slugIsKnown([], "tr", "sirket-kurulusu"), false, "bos harita false");
expect(slugIsKnownInAnyLocale(entries, "company-formation"), true, "dil degistirici: baska dilin slug'i taninir");
expect(slugIsKnownInAnyLocale(entries, "yok-boyle-bir-sey"), false, "bilinmeyen slug her dilde false");
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Run: `npx --no-install tsx scripts/check-content-keys.ts`
Expected: FAIL — `Cannot find module '../src/lib/contentKeys'`

- [ ] **Step 3: `src/lib/contentKeys.ts`'i yaz**

Üç fonksiyon da saf; `prisma` veya `next/cache` **import etmez** (test veritabanısız çalışsın diye). `clampPage` toplam sayfa sayısını `Math.max(1, Math.ceil(totalItems / perPage))` ile bulur.

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu gör**

Run: `npx --no-install tsx scripts/check-content-keys.ts`
Expected: PASS, `hata yok`, exit 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/contentKeys.ts scripts/check-content-keys.ts
git commit -m "feat(cache): onbellek anahtarlari icin saf yardimcilar"
```

---

### Task 2: Etiket sabitleri ve önbellekli okumalar

**Files:**
- Create: `src/lib/cacheTags.ts`
- Modify: `src/lib/content.ts`
- Test: `scripts/check-cache-tags.ts`

**Interfaces:**
- Consumes: Task 1'in üç yardımcısı
- Produces:
  - `CACHE_TAGS` — `{ settings: "settings"; pageContent: "page-content"; services: "services"; references: "references"; posts: "posts" }` (`as const`)
  - `CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]`
  - `content.ts`'in dışa aktarılan imzaları **değişmez** (çağıranlar güncellenmeyecek)

- [ ] **Step 1: Testi yaz** — `scripts/check-cache-tags.ts`, A bölümü. Kaynak dosyaları metin olarak okuyup yapıyı doğrular (veritabanı gerekmez):

```ts
// content.ts'te prisma'ya inen her disa aktarilan okuma sarmalanmis olmali
expectWrapped("getPageContent"); expectWrapped("getServices"); expectWrapped("getService");
expectWrapped("resolveServiceSlug"); expectWrapped("getReferences"); expectWrapped("getPosts");
expectWrapped("getPost"); expectWrapped("resolvePostSlug"); expectWrapped("countPublishedPosts");
expectWrapped("getPublishedPostsPage"); expectWrapped("getAllLocalizedSlugs"); expectWrapped("getSettings");
// etiket olarak yalnizca CACHE_TAGS degerleri kullanilmali
expectNoRawTagStrings();
// her sarmalayici 86400 kullanmali
expectRevalidate(86400);
```

`expectWrapped(ad)` o fonksiyonun gövdesinin `unstable_cache` ile üretilmiş bir sarmalayıcıyı çağırdığını doğrular. `expectNoRawTagStrings()` `tags: [` içinde `CACHE_TAGS.` dışında bir şey geçmediğini doğrular.

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: FAIL — sarmalanmamış fonksiyonlar listelenir

- [ ] **Step 3: `src/lib/cacheTags.ts`'i yaz**

Beş sabit, `as const`, ve `CacheTag` tipi. Başka hiçbir şey.

- [ ] **Step 4: `content.ts`'teki okumaları sarmala**

Her okuma için `unstable_cache(fn, keyParts, { tags, revalidate: 86400 })`. `keyParts` fonksiyon adını içermeli (argümansız `getSettings` için şart). Etiket eşlemesi tasarımdaki tabloya birebir uyar; `getAllLocalizedSlugs` hem `services` hem `posts` etiketini alır.

- [ ] **Step 5: Anahtar uzayını sınırla**

Dört slug fonksiyonu ve `getPublishedPostsPage` için dışa aktarılan ad **önbelleksiz ince bir sarmalayıcı** olur; önbellekli iç fonksiyon yalnızca doğrulanmış girdiyle çağrılır:

- `getService` / `getPost` → `slugIsKnown(...)` false ise veritabanına inmeden `null`
- `resolveServiceSlug` / `resolvePostSlug` → `slugIsKnownInAnyLocale(...)` kullanır (dil değiştirici başka dilin slug'ıyla gelir; yalnızca hedef dile bakan bir kontrol dil değiştirmeyi kırar)
- `getPublishedPostsPage` → önce önbellekli `countPublishedPosts(locale)`, sonra `clampPage(...)`, sonra önbellekli iç fonksiyon

Slug kümesi önbellekli `getAllLocalizedSlugs()`'tan gelir.

> **Bilinçli davranış değişikliği:** `getAllLocalizedSlugs` başlığı boş olan çevirileri atlıyor. Bu yüzden o dilde başlığı boş bir hizmet/yazı artık `getService`/`getPost`'tan `null` dönecek, yani sayfası 404 olacak. Bugün boş başlıklı bir sayfa render ediliyor. Çevrilmemiş içeriğin yayında olmaması doğrusu; `resolveServiceSlug` zaten bu kuralı uyguluyordu.

- [ ] **Step 6: Testi çalıştır, yeşil olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: PASS, exit 0

- [ ] **Step 7: Tip kontrolü**

Run: `npx --no-install tsc --noEmit`
Expected: çıkış kodu 0, hata yok

- [ ] **Step 8: Commit**

```bash
git add src/lib/cacheTags.ts src/lib/content.ts scripts/check-cache-tags.ts
git commit -m "feat(cache): okumalari etiketli unstable_cache ile sarmala"
```

---

### Task 3: SMTP ayarları önbelleğe girmesin

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/lib/mail.ts`
- Test: `scripts/check-cache-tags.ts` (B bölümü eklenir)

**Interfaces:**
- Produces: `getSettingsUncached(): Promise<Record<string, string>>` — `getSettings`'in önbelleksiz ikizi

- [ ] **Step 1: Testi yaz** — `check-cache-tags.ts`'e ekle:

```ts
expect(consumersOf("getSettingsUncached"), ["src/lib/mail.ts"], "getSettingsUncached'in tek tuketicisi mail.ts");
expect(fileImports("src/lib/mail.ts", "getSettings"), false, "mail.ts onbellekli getSettings'i kullanmaz");
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: FAIL — `getSettingsUncached` yok

- [ ] **Step 3: `getSettingsUncached`'i ekle ve `mail.ts`'i ona geçir**

`getSettings`'in bugünkü gövdesi `getSettingsUncached` olur; önbellekli `getSettings` onu sarmalar. `mail.ts:2` importu `getSettingsUncached`'e, `mail.ts:6` çağrısı buna döner.

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: PASS, exit 0

- [ ] **Step 5: Commit**

```bash
git add src/lib/content.ts src/lib/mail.ts scripts/check-cache-tags.ts
git commit -m "feat(cache): SMTP ayarlarini onbellek disinda birak"
```

---

### Task 4: Panel etiketleri temizlesin

**Files:**
- Modify: `src/app/admin/actions.ts`
- Test: `scripts/check-cache-tags.ts` (C bölümü eklenir)

**Interfaces:**
- Consumes: Task 2'nin `CACHE_TAGS` sabiti

- [ ] **Step 1: Testi yaz** — `check-cache-tags.ts`'e ekle. Tasarımdaki eşleme tablosu teste gömülür:

```ts
// her icerik action'i dogru etiketi temizlemeli
expectTag("updateServiceAction", "services"); expectTag("createServiceAction", "services");
expectTag("deleteServiceAction", "services"); expectTag("moveServiceAction", "services");
expectTag("setServiceVisibleAction", "services"); expectTag("archiveServiceAction", "services");
expectTag("restoreServiceAction", "services");
expectTag("updateContentAction", "page-content");
expectTag("addReferenceAction", "references"); expectTag("updateReferenceFullAction", "references");
expectTag("moveReferenceAction", "references"); expectTag("updateReferenceAction", "references");
expectTag("deleteReferenceAction", "references"); expectTag("setReferenceVisibleAction", "references");
expectTag("archiveReferenceAction", "references"); expectTag("restoreReferenceAction", "references");
expectTag("updateSettingsAction", "settings");
expectTag("createPostAction", "posts"); expectTag("updatePostAction", "posts");
expectTag("deletePostAction", "posts"); expectTag("setPostPublishedAction", "posts");
expectTag("archivePostAction", "posts"); expectTag("restorePostAction", "posts");
// icerik disi action'lar etiket temizlemez
expectNoTag("loginAction"); expectNoTag("createUserAction"); expectNoTag("deleteMessageAction");
expectNoTag("bulkMessageAction"); expectNoTag("setUserRoleAction");
// yeni eklenen her mutasyon action'i ya listede ya da bilincli disarida olmali
expectEveryMutatingActionClassified();
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: FAIL — 23 action'da `revalidateTag` yok

- [ ] **Step 3: `revalidateTag` çağrılarını ekle**

23 action'a, mevcut `revalidatePath` çağrılarının yanına. Etiket değeri `CACHE_TAGS.*` sabitinden gelir, düz string değil. `revalidatePath` çağrıları **silinmez**.

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu gör**

Run: `npx --no-install tsx scripts/check-cache-tags.ts`
Expected: PASS, exit 0

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/actions.ts scripts/check-cache-tags.ts
git commit -m "feat(cache): panel mutasyonlarinda etiketleri temizle"
```

---

### Task 5: Belgeleme ve tam doğrulama

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README'yi güncelle**

Yeni bir *Veri katmanı önbelleği* bölümü: ne önbellekleniyor, beş etiket, `revalidate: 86400`'ün gerekçesi, `mail.ts`'in neden önbelleksiz okuduğu, slug/sayfa sınırlamasının ne işe yaradığı, ve **yeni bir okuma veya içerik action'ı eklerken ne yapılması gerektiği**. Test listesine `check-content-keys.ts` ve `check-cache-tags.ts` eklenir. `?page=` aralık dışıyken son sayfaya kırpıldığı davranış değişikliği yazılır.

- [ ] **Step 2: Bütün testler**

Run: her `scripts/check-*.ts` dosyası tek tek `npx --no-install tsx` ile
Expected: hepsi exit 0

- [ ] **Step 3: Tip kontrolü ve lint**

Run: `npx --no-install tsc --noEmit` ve `npx --no-install eslint src scripts`
Expected: ikisi de çıkış kodu 0

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: çıkış kodu 0, logda `EPERM` yok (varsa `prisma generate` atlanmıştır, build bayattır)

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs(readme): veri katmani onbellegini belgele"
```

---

## Veritabanı açıldığında (bu planın dışı)

Tasarımın risk bölümünde taşınan doğrulama: panelden bir içerik kaydedip yayında anında göründüğünü görmek, ve Prisma panosundan işlem sayısını ölçmek. Kabul ölçütü: bir sonraki tam dönemde aylık işlem **50.000'in altında**.
