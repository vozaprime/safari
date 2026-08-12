# Makale içi görseller + medya kütüphanesi + görsel seçici — Tasarım

> Tarih: 2026-08-12
> Durum: Onaylandı (tasarım) — uygulama planı bekleniyor
> Branch: `claude/services-article-image-upload-dfa315`

## 1. Problem

Bugün hizmet (ve blog) makalelerine görsel eklemek çok kısıtlı:

- Her hizmete yalnızca **tek** banner görseli (`Service.image`) yüklenebiliyor; bu görsel hem kartta hem detay banner'ında kullanılıyor.
- Makale ortasındaki tek "inline" görsel **koda gömülü** (`src/app/[locale]/services/[slug]/page.tsx` içindeki `inlineImages` haritası). Panelden düzenlenemiyor, her hizmette tam olarak bir tane ve sabit konumda.
- Zengin metin editöründe (`RichTextEditor`) görsel ekleme yok.
- Medya kütüphanesi (`/admin/media`) yalnızca listeleme + silme; yükleme düğmesi ve tekrar kullanım için seçici yok.

## 2. Hedef

Kullanıcının (site sahibi, teknik olmayan) panelden:

1. **Makale metninin içine, istediği noktaya, istediği kadar görsel** ekleyebilmesi.
2. **Medya bölümünden doğrudan** (ve toplu) görsel yükleyebilmesi.
3. Yüklediği görselleri **tüm görsel alanlarında "Kütüphaneden seç" ile tekrar kullanabilmesi** (hizmet banner'ı, referans logosu, blog kapağı, ayarlardaki logo/favicon ve makale içi).
4. **Toplu (çoklu dosya) yükleme** yapabilmesi.

Kararlaştırılan kapsam (kullanıcı onayı):

- Makale içi görseller **metnin istenen herhangi bir yerine** eklenir (sabit tek orta görsel değil).
- Görsel seçici **her görsel alanında** kullanılabilir.
- Toplu yükleme **dahildir**.

## 3. Genel yaklaşım

Görseller, makale metninin içine **mini-markdown görsel satırı** olarak gömülür:

```
![açıklama metni](https://.../gorsel.jpg)
```

Metin zaten tek bir alanda saklanıyor (`ServiceTranslation.description`, `PostTranslation.body`, `PageContent.value`). Görseli bu metnin bir parçası yaparak:

- **Veritabanı şeması değişmez.**
- Görsel, metnin tam istenen noktasında durur; sıralama/konum "bedava" gelir.
- Mevcut kaydetme aksiyonları (`updateServiceAction`, `updatePostAction`, `updateContentAction`) ve `revalidatePath` olduğu gibi çalışır.

**Reddedilen alternatif:** Her görsel için ayrı DB kaydı + konum indeksi. Şema değişikliği, ek ilişki yönetimi ve editörde konum sürükleme gerektirirdi — bu ihtiyaç için aşırı mühendislik.

## 4. Bileşenler

### A. Ortak render katmanı — `src/lib/richtext.tsx` (değişir)

`RichBlock` birliğine yeni tür eklenir:

```ts
| { kind: "image"; src: string; alt: string }
```

`parseBlocks`: bir blok **tamamen** `![alt](url)` kalıbına uyuyorsa (kendi paragrafında) `image` bloğuna ayrıştırılır. Regex: `^!\[([^\]]*)\]\(([^)\s]+)\)$` (blok `trim`'lendikten sonra).

`ProseText`: `image` bloğunu `<figure>` olarak çizer (yumuşak kenar, doğal en-boy; `alt` varsa `<figcaption>`). Renkler ebeveynden miras (mevcut desen).

Bu değişiklik `ProseText` kullanan tüm içerik alanlarını (ContentEditor'daki `kind:"rich"` alanları) otomatik kapsar.

### B. Makale gövdesi — `src/components/ArticleBody.tsx` (değişir)

- Gövdedeki `image` bloklarını `<figure>` + `Reveal` ile çizer. **Görsel kırpılmaz** (`w-full h-auto`), yuvarlatılmış kenar + `border-sand`. `alt` doluysa altına ince alt-yazı.
- **Geriye dönük uyum:** Mevcut `inlineImage`/`inlineAlt` prop'ları (koddaki `inlineImages` haritasından gelir) korunur, ama **yalnızca gövdede hiç `image` bloğu yoksa** yedek olarak eski konumunda (2. başlıktan önce) gösterilir. Böylece:
  - Halihazırdaki 13 hizmet görünümünü kaybetmez.
  - Kullanıcı gövdeye görsel eklediğinde kendi görselleri devreye girer, eski sabit görsel gizlenir.

### C. Medya listeleme mantığının paylaşılması — `src/lib/media.ts` (yeni)

`src/app/admin/(panel)/media/page.tsx` içindeki `listMedia()` (Blob `list` + yerel FS yedeği) buraya taşınır ve `export` edilir. Dönüş türü: `{ url: string; name: string; size: number; date?: Date }[]`. Hem medya sayfası hem yeni API bunu kullanır (tek kaynak).

### D. Medya listeleme API'si — `src/app/api/admin/media/route.ts` (yeni)

`GET` — `getVerifiedSession()` ile korumalı. `listMedia()` sonucunu JSON döner (tarih ISO string olarak). `MediaPicker` istemci bileşeni bunu çağırır.

### E. Medya seçici modal — `src/components/admin/MediaPicker.tsx` (yeni)

İstemci bileşeni. Props: `open`, `onClose`, `onSelect(url: string)`, opsiyonel `accept` (varsayılan `image/*`).

- Açılınca `GET /api/admin/media`'dan listeyi çeker, ızgarada gösterir (görsel önizleme + dosya adı). Video öğeleri `accept` görsel ise gizlenebilir/gösterilebilir.
- Bir öğeye tıklama → `onSelect(url)` + kapan.
- Modalın içinde **"Yeni yükle"** alanı: `/api/admin/upload`'a yükler, biter bitmez listeye ekler ve seçili yapar.
- Basit modal (portal veya sabit konumlu overlay), `Esc` ile kapanır, arka plan tıklaması kapanır.

### F. Editöre "Görsel" düğmesi — `src/components/admin/RichTextEditor.tsx` (değişir)

- Araç çubuğuna "Görsel" düğmesi (ikon). Tıklama → `MediaPicker` açar.
- Seçim yapılınca imlecin olduğu yere `\n\n![alt](url)\n\n` eklenir (`alt` varsayılan olarak dosya adından türetilir). Mevcut `surround`/`prefixLines` desenine benzer bir `insertAtCursor` yardımcı fonksiyonu eklenir.
- Önizleme (`ProseText`) görseli anında gösterir.
- Hizmet, blog ve içerik editörleri bu düğmeyi otomatik kazanır.
- Editör araç çubuğu ipuçları/hint metni görsel eklemeyi de anacak şekilde güncellenir.

### G. "Kütüphaneden seç" her alanda — `src/components/admin/Uploader.tsx` (değişir)

- Mevcut "yükle" + "URL yapıştır" yanına **"Kütüphaneden seç"** düğmesi. Tıklama → `MediaPicker` açar → seçilen URL `value`'ya yazılır.
- `Uploader`'ı kullanan tüm yerler kapsanır: hizmet banner'ı, referans logosu, blog kapağı, ayarlardaki `site_logo`/`site_favicon`.

### H. Medya kütüphanesinde toplu yükleme — `src/app/admin/(panel)/media/page.tsx` (değişir) + `src/components/admin/MediaUploader.tsx` (yeni)

- Sayfa (server component) `listMedia`'yı `@/lib/media`'dan alır. Izgara + silme aynen kalır.
- Üstüne istemci bileşeni `MediaUploader`:
  - Sürükle-bırak alanı + çoklu dosya seçici (`<input type="file" multiple>`).
  - Her dosyayı `/api/admin/upload`'a yükler (paralel veya sıralı), dosya-başı ilerleme/hata gösterir.
  - Tümü bitince `router.refresh()` ile listeyi tazeler.

## 5. Veri akışı

1. **Yükleme:** İstemci → `POST /api/admin/upload` (tek dosya) → Blob (canlı) / yerel FS (dev) → `{ url }`. Toplu yükleme bu uç noktayı dosya başına çağırır. **Yeni yükleme uç noktası yok.**
2. **Listeleme:** `MediaPicker` → `GET /api/admin/media` → `listMedia()`.
3. **Kaydetme:** Görsel URL'i metnin içine yazılır; makale kaydedilince mevcut `update*Action` çağrıları `revalidatePath("/", "layout")` yapar → site anında güncellenir.
4. **Silme:** Mevcut `deleteMediaAction` aynen kalır.

## 6. Sınır ve uç durumlar

- **Görsel satırı kendi paragrafında olmalı.** Editör bunu otomatik boş satırlarla ekler. Kullanıcı metin ortasına elle `![...]()` yazarsa görsel olarak değil, düz paragraf olarak kalır — kabul edilebilir; hint metni bunu belirtir.
- **`alt` metni** varsayılan dosya adından türetilir; kullanıcı markdown'daki `![...]` kısmını düzenleyebilir.
- **Tür/boyut doğrulaması** mevcut upload API kontrolleriyle aynı (görsel 8 MB, video 50 MB; tür beyaz listesi).
- **URL güvenliği:** `src` yalnızca `<img src>` olarak kullanılır; `parseBlocks` yalnızca `![alt](url)` kalıbını kabul eder, keyfi HTML enjekte edilmez (mevcut renderer HTML basmaz, React düğümleri üretir).
- **Video:** Makale içi gömme kapsamı **görsellerdir**. `MediaPicker` görsel alanlarında video öğelerini varsayılan olarak filtreler.
- **CRLF:** `parseBlocks` zaten `\r\n?` → `\n` normalize ediyor; yeni image ayrıştırması bundan sonra çalışır.

## 7. Değişen / eklenen dosyalar

**Değişir:**
- `src/lib/richtext.tsx` — `image` blok türü + ayrıştırma + `ProseText` render.
- `src/components/ArticleBody.tsx` — `image` blok render + eski `inlineImage` yalnızca yedek.
- `src/components/admin/RichTextEditor.tsx` — "Görsel" düğmesi + `MediaPicker` + imlece ekleme.
- `src/components/admin/Uploader.tsx` — "Kütüphaneden seç" düğmesi + `MediaPicker`.
- `src/app/admin/(panel)/media/page.tsx` — `listMedia`'yı `@/lib/media`'dan al + `MediaUploader` ekle.

**Yeni:**
- `src/lib/media.ts` — paylaşılan `listMedia()`.
- `src/app/api/admin/media/route.ts` — `GET` medya listesi (JSON, oturum korumalı).
- `src/components/admin/MediaPicker.tsx` — seçici modal (mevcutları göster + yeni yükle).
- `src/components/admin/MediaUploader.tsx` — medya sayfası çoklu/sürükle-bırak yükleyici.

**Değişmez:** Prisma şeması, `deleteMediaAction`, `/api/admin/upload`.

## 8. Doğrulama

- Yerel `npm run build` + tarayıcı MCP (`preview_start name: safari-consulting`).
- Test senaryoları:
  1. Hizmet editöründe metne 2 görsel ekle → kaydet → detay sayfasında iki görsel de doğru sırada, kırpılmadan görünüyor.
  2. Görselsiz bir eski hizmet → eski sabit orta görsel hâlâ görünüyor (yedek).
  3. Medya sayfasında 3 dosyayı sürükle-bırak → hepsi yüklenir, listede görünür.
  4. Referans logosu / blog kapağında "Kütüphaneden seç" → önceki yükleme seçilebiliyor.
  5. Blog yazısı gövdesine görsel → blog detayında görünüyor.
- Konsol/sunucu hatasız, `npm run lint` = 0.
