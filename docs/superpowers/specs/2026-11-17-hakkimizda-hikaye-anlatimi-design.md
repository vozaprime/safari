# Hakkımızda sayfası — hikâye anlatımı tasarımı

**Tarih:** 2026-11-17
**Durum:** onay bekliyor

## Niyet ve gerekçe

Hakkımızda, müşteri adaylarının en çok değer verdiği sayfa. Şu anda sayfanın
açılışı (`StoryHero`, sinematik scrub videosu) doğru dili konuşuyor, ama hemen
ardından gelen anlatı bölümü dar bir sütunda 7 paragraflık düz metin olarak
akıyor — kullanıcının ifadesiyle "Word dosyası gibi". Açılışın kurduğu beklenti
ikinci ekranda düşüyor.

Amaç: ana sayfadaki hikâye anlatımının (`ProcessStory`) dilini bu bölüme
taşımak — **metnin tek kelimesini kaybetmeden**.

## Hedefler

- Anlatı bölümü, ana sayfadaki hikâye bölümüyle aynı görsel dili konuşsun:
  çapraz geçişli görsel, bölüm numarası, ilerleme göstergesi.
- `about_body` içindeki **7 paragrafın tamamı** sayfada kalsın.
- Bölüm, panelden metin düzenlendiğinde (paragraf eklenip çıkarıldığında)
  kendiliğinden uyum sağlasın.
- Mobilde bugünkünden daha iyi bir deneyim olsun, daha kötü değil.

## Hedef olmayanlar

- Hakkımızda metnini değiştirmek (metin kullanıcı tarafından onaylandı, dokunulmaz).
- Sayfanın diğer bölümlerine dokunmak (istatistikler, misyon/vizyon, değerler,
  referanslar, CTA).
- Yeni video varlığı eklemek (sitede hâlihazırda 22,5 MB video var).
- `ProcessStory`'yi veya ana sayfayı değiştirmek.
- Yeni i18n dizesi eklemek — gerekli başlıklar (`t.about.story_kicker`,
  `t.about.story_title`, `t.story.chapter`) zaten üç dilde mevcut.

## Başarısızlık sayılacaklar (anti-hedefler)

Teknik olarak çalışsa bile şunlardan biri olursa bu iş başarısızdır:

- Herhangi bir paragrafın metni kaybolur, kırpılır veya "devamını oku" ardına saklanır.
- Metin görselin üstüne binip okunabilirliği düşer.
- Kaydırma ele geçirilmiş hissi verir (sayfa yüksekliği şişirilip kullanıcı
  sabitlenmiş bir sahnede hapsolmaz).
- Panelden paragraf sayısı değişince düzen bozulur.
- Mobil deneyim bugünkünden geriler.

## Kısıtlar

- **İçerik veritabanından gelir.** `PageContent.about_body`, üç dilde, mini-markdown
  (`src/lib/richtext.tsx`). Panelden düzenlenebilir olmayı sürdürmeli.
- **En uzun dil İngilizce:** tr 245 kelime, en 322, ru 296 — düzen EN ile ölçülmeli.
- **Görsel havuzu sınırlı.** Higgsfield hesabında kredi yok, yeni görsel
  üretilemiyor ([[gorsel-kaynagi-higgsfield-kredisiz]]). Mevcut `public/images`
  havuzundan seçilecek; kullanıcı sonradan panelden değiştirecek.
- **`prefers-reduced-motion`** proje standardı: tüm animasyonlar kapanmalı.
- **Videolar gitignore'lu** — yerelde yoklar, yerel doğrulama görsellerle yapılır.
- Sayfalar `force-dynamic`; içerik değişikliği deploy beklemeden yansır, ama
  **bu iş kod değişikliği** olduğu için canlıya çıkması deploy gerektirir
  ([[vercel-deploy-not-git-connected]]).

## Değerlendirilen yaklaşımlar

### A — Bölüm şeritleri
Her paragraf tam genişlikte bir şerit, görsel dönüşümlü olarak sağda/solda.

*Artısı:* metin görselin üstüne hiç binmez, kurulumu en basit, kırılma riski en az.
*Eksisi:* 7 paragraf için 7 ayrı görsel gerekir; elde o kadar uygun görsel yok.
Aynı kalıbın yedi kez tekrarı monotonlaşır.

### B — Sabit sinema paneli + akan metin ✅ **seçilen**
Görsel sütunu sabit (sticky) kalır; metin kendi sütununda normal akar. Okuma
ilerledikçe paneldeki görsel çapraz geçişle değişir, bölüm numarası artar,
altın ilerleme çubuğu dolar.

*Artısı:* ana sayfadaki hisse en yakın olan bu — çapraz geçiş, bölüm numarası,
ilerleme çubuğu, hepsi oradaki dili konuşuyor. Görsel ihtiyacını 7'den 3-4'e
indiriyor (geçiş yaptıkları için). Metnin tek kelimesi gitmiyor. Sayfa yüksekliği
şişirilmediği için kaydırma ele geçirilmiş hissi vermiyor.
*Eksisi:* A'dan daha karmaşık; mobilde sabitlik kapanıp yığılmış düzene döner.

### C — Zaman şeridi omurgası (elendi)
Altın dikey çizgi, 1988 → 1995 → 2007 → bugün düğümleri.

*Neden elendi:* 7 paragrafın yalnızca 2'sinde yıl geçiyor; kalan beşi bugünü
anlatıyor ve kronolojik bir omurgaya oturmuyor. Zorlamak metni tarihe uydurmak
için eğip bükmeyi gerektirirdi — "metin aynen kalsın" kararına ters.

### D — `ProcessStory`'nin birebir kullanımı (elendi)
*Neden elendi:* `ProcessStory`'nin sahne başına metin alanı bir başlık + tek
cümle (~15 kelime, `h-56 md:h-64`, `max-w-md`). Paragraflar 25-60 kelime; sığmaz.
Ayrıca 7 sahne ≈ 740vh sabitlenmiş kaydırma (ana sayfada 440vh) demek.
## Kararlaştırılan tasarım

### Zemin: açık, koyu fotoğraf paneliyle

Bölüm sayfanın fildişi zemininde kalır; koyu kütleyi yanındaki tam yükseklikte
fotoğraf paneli getirir. `ProcessStory`'nin jestleri açık zemine uyarlanır
(orman yeşili düşük opaklıkta bölüm numarası, altın meta etiket ve ilerleme
çubuğu).

**Gerekçe:** Hakkımızda sayfasının bölüm zeminleri bugün koyu → açık → koyu →
açık → koyu → beyaz → koyu diye değişiyor. Bu bölüm koyu yapılırsa açılış
videosu, hikâye ve istatistikler arka arkaya üç koyu ekran olur ve açılışın
etkisi söner. Kullanıcı bu gerekçeyle açık zemini seçti.

### Yeni bileşen: `src/components/StoryScroll.tsx`

İstemci bileşeni (`"use client"`).

```ts
StoryScroll({
  blocks: RichBlock[];  // parseBlocks çıktısı, sırayla
  scenes: string[];     // 4 görsel URL'si (dilden bağımsız)
  kicker: string;       // t.about.story_kicker  → "HİKÂYEMİZ"
  title: string;        // t.about.story_title   → "Stratejik çözüm ortağınız"
  chapterLabel: string; // t.story.chapter       → "BÖLÜM"
})
```

### Kaydırma takibi: `useScrollStage`, `IntersectionObserver` değil

**Kontrol sonrası değişti.** Depoda zaten `src/lib/useScrollProgress.ts` içinde
`useScrollStage` var (`ServiceUniverse` kullanıyor). rAF tabanlı ve yorumunda
gerekçesi yazılı: smooth-scroll kütüphaneleri ve bazı gömülü tarayıcılar native
scroll olaylarını güvenilir biçimde tetiklemiyor. Site Lenis kullandığı için bu
doğrudan bizi ilgilendiriyor.

`useScrollStage(4)` hem **etkin sahneyi** hem de her karede **sürekli ilerleme**
değerini (0..1) veriyor. Böylece altın çubuk ana sayfadaki gibi kesintisiz
dolar — `IntersectionObserver` ile yalnızca kademeli dolabilirdi. React state'i
yalnızca sahne indeksi değişince güncelleniyor, çubuk ref üzerinden sürülüyor.

### Sahne sayısı sabit 4, paragraf sayısı serbest

Sahneler panelden yönetilen 4 görsel alanına karşılık geldiği için sabit 4.
`useScrollStage(4)` bölümü dört eşit kaydırma evresine böler; bu, paragraf
sayısından bağımsızdır. Panelden paragraf eklenip çıkarılması düzeni bozmaz —
"panelden düzenlenebilir kalsın" hedefi böyle karşılanır.

### Sahne görselleri: panelden yönetilir

**Kontrol sonrası değişti.** Önceki taslak görselleri kodda sabitliyordu; bu,
kullanıcıya verilen "panelden değiştirirsin" sözüyle çelişiyordu.

`Setting` tablosunda dört anahtar: `about_scene_1` … `about_scene_4`.
`Setting` dilden bağımsız olduğu için görseller üç dilde ortaktır — bir görseli
değiştirmek tek bir işlem olur. Yönetim panelinde Ayarlar sayfasına, `site_logo`
ve `site_favicon` ile aynı desende dört "Kütüphaneden seç" (`MediaPicker`) alanı
eklenir; `updateSettingsAction` içindeki izinli anahtar listesine de girerler.

Alan boşsa o sahne için varsayılana düşülür:

| Sahne | Varsayılan | Anlatıdaki yeri |
|---|---|---|
| 1 | `/images/services/sirket-kurulusu.jpg` | kuruluş, Cağaloğlu, şubeler |
| 2 | `/images/about.jpg` | stratejik danışmanlığa geçiş, bugünün hizmetleri |
| 3 | `/images/services/ticaret-is-gelistirme.jpg` | çözüm ortaklıkları, değerler |
| 4 | `/images/heroes/services.jpg` | gelecek vizyonu |

**Bilinen sınır:** havuzdaki hiçbir görsel 1988'i, çeviri hizmetlerini veya
Cağaloğlu'nu betimlemiyor; hepsi genel kurumsal görseller. Görseller anlatıyı
resmetmiyor, ona eşlik ediyor. Kullanıcı tarihsel fotoğraf yüklerse ilk iki
sahne belirgin biçimde güçlenir.

### Düzen ve kırılma noktası

**Kontrol sonrası değişti.** Önceki taslak yapışkan iki sütunu `lg`'den (≥1024)
başlatıyordu. Orada hesap tutmuyor: `max-w-6xl` içinde 984 − 560 panel − 64
boşluk = **360px metin sütunu**, yani satır başına beş altı kelime. Bu,
"deneyim gerilemesin" anti-hedefine takılır.

- **`xl` ve üzeri (≥1280):** iki sütun; metin solda, yapışkan fotoğraf paneli
  sağda. Panel navigasyonun (73px) altında kalacak bir `top` değeriyle sabitlenir.
  Panel içinde: üst üste binmiş görsel katmanları (etkin olan opak), köşede büyük
  Playfair bölüm numarası, meta etiket (`HİKÂYEMİZ · BÖLÜM 02 — 04`) ve ince
  altın dikey ilerleme çubuğu.
- **`xl` altı (mobil ve tablet dahil):** tek sütun. Yapışkanlık kapanır; her
  sahnenin ilk paragrafından önce o sahnenin görseli tam genişlikte bir şerit
  olarak araya girer. Şerit konumları `ceil(paragrafSayısı / 4)` ile hesaplanır
  (7 paragraf → 0, 2, 4, 6. paragrafların önüne). Görsel ritim korunur.

**`prefers-reduced-motion`:** çapraz geçiş ve ken-burns kapanır, görsel anında
değişir. `Reveal` zaten `globals.css` içinde nötrleniyor.

### İçerik akışı ve blok işleme

**Kontrol sonrası düzeltildi — önceki taslakta gerçek bir hata vardı.** Şu
ifade görsel bloklarını sessizce siliyordu, çünkü `image` bloğunda `b.text`
tanımsız:

```ts
// HATALI (önceki taslak)
parseBlocks(...).map((b) => (b.kind === "list" ? b.items.join(" ") : b.text)).filter(Boolean)
```

Bu, "hiçbir paragrafın metni kaybolmasın" anti-hedefini ihlal ediyordu. Ayrıca
paragraflar `string[]` olarak geçtiği için `renderInline` uygulanmıyor, panelden
eklenen `**kalın**` ekranda yıldızlarıyla görünüyordu — bugünkü `ProseText`
yolunda bu sorun yok.

Düzeltilmiş davranış:

- Sayfa `parseBlocks(content.about_body)` çağırır ve blokları bileşene verir.
- `para`, `heading`, `quote`, `list` blokları **hepsi** render edilir; hiçbiri
  düşürülmez. `heading` ve `quote` anlatı tonuna uygun ama sakin bir biçimde,
  `list` altın kare imlerle (`ProseText` ile tutarlı).
- Satır içi işaretler `renderInline` ile çözülür, böylece `**kalın**` ve
  `*italik*` doğru görünür.
- `image` blokları metin akışından çıkarılır ve **sahne havuzunun sonuna
  eklenir**; böylece panelden metne görsel gömen bir editörün eklediği görsel
  kaybolmaz, anlatının görsel katmanında kullanılır.

### Sayfa entegrasyonu

`src/app/[locale]/about/page.tsx` içindeki mevcut "Story narrative" bölümü
(iki sütunlu grid + görsel kolajı) tamamen `StoryScroll` ile değiştirilir.
Başlık ve kicker bugünkü i18n anahtarlarından gelmeye devam eder; yeni dize
eklenmez.

### Dal ve teslim

- İş, mevcut `claude/hakkimizda-metni` dalında (PR #8) sürer.
- PR #8'deki `83f2df6` (görsel sütununu yapışkan yapan düzeltme) **geri alınır**;
  o bölüm tamamen değiştiği için anlamsız hale geliyor.
- PR #8 böylece tek bir bütün olur: *Hakkımızda — yeni metin + yeni anlatım.*
- Metin zaten canlıda (uygulandı ve üç dilde doğrulandı); bu iş **kod**
  değişikliği olduğu için canlıya çıkması `npx vercel deploy --prod --yes`
  gerektirir. Deploy kararı kullanıcınındır.

### Doğrulama ortamı

Onaylı 7 paragraflık metin **halihazırda paylaşılan veritabanında**
(`apply-about.ts --write` çalıştırıldı, üç dilde canlıda doğrulandı), dolayısıyla
düzen gerçek metinle ölçülebilir. `DATABASE_URL` ana depodaki `.env`'den gelir;
yerel çalıştırmalar için worktree'ye kopyalanır ve commit edilmez.

## Doğrulama

- `npm run build`, `npm run lint`, `tsc --noEmit` → hepsi 0
- Tarayıcıda 1440, 1280, 1024 ve 375 genişlikte; **İngilizce** dahil üç dilde
  (EN 322 kelimeyle en uzunu, taşma orada görünür)
- Her dilde 7 paragrafın tamamının DOM'da olduğu **sayılarak** doğrulanır
- 1024'te tek sütuna düştüğü ve metin genişliğinin okunur kaldığı ölçülür
- Yapışkan panel navigasyonun altında kalır, yatay kaydırma oluşmaz
- İlerleme çubuğunun kaydırmayla sürekli dolduğu doğrulanır
- `prefers-reduced-motion` açıkken geçişlerin kapandığı doğrulanır
- Panelden bir sahne görseli değiştirilip sayfaya yansıdığı doğrulanır
- Konsol hatası yok

## Uygulayıcıya bırakılanlar

- Geçiş süresi, yumuşatma eğrisi ve ken-burns yoğunluğunun tam değerleri.
- Yapışkan panelin tam `top`/yükseklik değerleri (nav 73px).
- Bölüm numarasının ve ilerleme çubuğunun panel içindeki tam yerleşimi.
- Paragraf aralıkları ve tipografi ölçeği (mevcut `ProseText` tonuyla uyumlu).
- `heading`/`quote` bloklarının açık zemindeki tam stili.
