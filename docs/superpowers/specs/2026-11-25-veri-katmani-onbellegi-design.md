# Veri katmanı önbelleği — tasarım

**Tarih:** 2026-11-25
**Durum:** onay bekliyor

## Niyet ve sebep

25 Kasım 2026'da sitenin bütün dinamik sayfaları 500 döndü. Sebep kod değil kota:
Prisma Postgres Free planının aylık **200.000 işlem** hakkı doldu (**200.745**, %105).
Sunucu bağlantıyı `planLimitReached` ile reddediyor; Prisma bunu yanıltıcı biçimde
`P1001: Can't reach database server` olarak raporluyor (bkz. oturum notu). Depolama
sorun değil: 2 GiB'ın 0'ı kullanılmış.

Kota 1 Aralık'ta sıfırlanıyor, ama aynı duvara her ay çarpacağız: mimari her ziyareti
pahalı yapıyor. Tek bir `/tr/hakkimizda` görüntülemesi **~8 veritabanı işlemi** harcıyor:

| Nerede | Sorgu |
|---|---|
| `[locale]/layout.tsx` → `generateMetadata` | `getSettings` |
| `[locale]/layout.tsx` | `getSettings`, `getServices`, `countPublishedPosts` |
| `[locale]/about/page.tsx` | `getPageContent`, `getServices`, `getReferences`, `getSettings` |

İki ayrı israf var: (1) aynı veri tek istekte birden çok kez sorgulanıyor — `getSettings`
üç kez, `getServices` iki kez; (2) 13 rotanın hepsinde `force-dynamic` var, yani her
ziyaret ve her arama motoru taraması veritabanına iniyor. 3 dil × ~32 sayfa ≈ 96 URL;
tek bir tam tarama ~770 işlem.

## Hedefler

- Aylık veritabanı işlem sayısını Free planın 200.000'inin **çok altına** indirmek
- İçeriğin panelden kaydedildiği anda yayında görünmesini **bozmamak**
- Render davranışını değiştirmemek (bu işin kapsamı veri katmanı)
- Yönetim panelinin her zaman taze veri görmesi

## Hedef olmayanlar

- Sayfa HTML'ini önbelleklemek / `force-dynamic`'i kaldırmak (ayrı iş, aşağıda B)
- Cache Components (`use cache`) migrasyonu (aşağıda C)
- Vercel fonksiyon maliyetini düşürmek (A'nın yan etkisi değil, B'nin konusu)
- Sorgu sayısını kodda azaltmak (React `cache()` ile istek içi tekilleştirme) — önbellek
  zaten veritabanına inmeyi engellediği için kota açısından gereksiz; istenirse sonra

## Karşı hedefler (bunlar olursa iş başarısız sayılır)

- Panelden kaydedilen bir içeriğin yayında geç görünmesi
- Yöneticinin panelde bayat veri görmesi
- Bir etiketin unutulması yüzünden içeriğin **süresiz** bayat kalması

## Kısıtlar

- **Veritabanı 1 Aralık'a kadar kapalı** (ya da Starter'a geçilene kadar). Kod yazılabilir,
  TypeScript ve build doğrulanabilir; uçtan uca doğrulama ancak açılınca yapılabilir.
- `unstable_cache` girdileri **deploy'ları aşar**; `use cache` girdileri aşmaz (anahtarına
  build ID girer). Bu projede deploy sonrası soğuk önbellek istemiyoruz.
- Public sayfaların hiçbiri `cookies()`/`headers()` kullanmıyor — `unstable_cache` için engel yok.
- `revalidatePath("/", "layout")` panelde zaten kurulu (31 çağrı); içeriğe dokunan her
  server action'da var. Bunlar korunacak.
- Prisma 6.19.3, Next 16.4.6, `cacheComponents` kapalı.

## Değerlendirilen yollar

**A — Veri katmanını `unstable_cache` ile önbellekle (SEÇİLDİ).** Sayfalar bugünkü gibi
her istekte render edilir ama veritabanına inmezler. İşlem düşüşü ~%95+, render davranışı
değişmez, önbellek deploy'ları aşar. Kota sorununu doğrudan hedefleyen yol bu.

**B — A + `force-dynamic`'i kaldırıp ISR'a geçmek.** Ek kazanç veritabanı işlemi değil,
Vercel fonksiyon çağrısı ve sayfa hızı. Blog ve iletişim sayfaları `searchParams` kullandığı
için dinamik kalmalı; detay rotalarında `generateStaticParams` yok. Değerli ama acil değil,
ayrı iş olarak bırakıldı.

**C — Cache Components (`use cache`).** `cacheComponents` + `partialPrefetching` bayrakları
ve baştan sona migrasyon gerektiriyor, üstelik önbellek her deploy'da sıfırlanıyor. Kota
derdine B'den fazlasını vermiyor, riski en yüksek olan bu. Reddedildi.

## Tasarım

### Önbelleklenecek okumalar

`src/lib/content.ts` içindeki, Prisma'ya inen bütün dışa aktarılan okuma fonksiyonları.
Panel kendi verisini doğrudan Prisma ile okuyor, bu yüzden önbellek yöneticiye bayat veri
göstermez. `getSettings`'in iki public olmayan tüketicisi var: `admin/login/page.tsx`
(logo/başlık okur, etiketle tazelenir — sakıncası yok) ve **`src/lib/mail.ts`**, onu da
`api/contact/route.ts` ile `admin/actions.ts` kullanıyor.

**Karar: `mail.ts` ayarları önbelleksiz okuyacak.** `getSettings()` bütün `setting`
satırlarını döndürüyor, içinde `smtp_host`, `smtp_user`, `smtp_from` ve şifreli `smtp_pass`
var. E-posta gönderimi düşük hacimli (iletişim formu, şifre sıfırlama), yani gönderim başına
1 ek sorgu ölçülebilir bir maliyet değil. Buna karşılık iki şeyi birden kazanıyoruz: sırlar
Vercel Data Cache'ine hiç girmiyor, ve SMTP ayarı panel dışından değiştirilirse e-posta en
fazla bir sonraki gönderimde doğru yapılandırmayı kullanıyor. Bunun için `content.ts`
ayrı bir `getSettingsUncached()` dışa aktaracak; **tek kullanıcısı `mail.ts` olacak** ve
test betiği bu istisnanın genişlemediğini doğrulayacak.

| Fonksiyon | Etiket |
|---|---|
| `getSettings` | `settings` |
| `getPageContent` | `page-content` |
| `getServices`, `getService`, `resolveServiceSlug` | `services` |
| `getReferences` | `references` |
| `getPosts`, `getPost`, `resolvePostSlug`, `countPublishedPosts`, `getPublishedPostsPage` | `posts` |
| `getAllLocalizedSlugs` | `services` **ve** `posts` |

`slugIn` ve `POSTS_PER_PAGE` saf; dokunulmaz.

### Önbellek anahtarları sınırlı tutulacak

İnceleme sırasında bulunan kusur: üç yerde önbellek anahtarına doğrudan ziyaretçi girdisi
giriyor. Bu hâliyle sarmalamak, düzeltmenin hedeflediği arıza modunu açık bırakırdı —
rastgele URL tarayan tek bir bot, önbellek kurulduktan *sonra* da kotayı doldurabilirdi.

| Yer | Sorun | Çözüm |
|---|---|---|
| `blog/page.tsx` → `getPublishedPostsPage(locale, Number(pageParam))` | Normalizasyon fonksiyonun **içinde**; `?page=0`, `?page=-3`, `?page=2.7`, `?page=999999` hepsi ayrı anahtar | Normalizasyon önbelleğin **dışına** alınacak ve sayfa, önbellekli `countPublishedPosts` ile hesaplanan gerçek sayfa sayısına kırpılacak |
| `contact/page.tsx` → `getService(locale, searchParams.service)` | Geçersiz slug her seferinde yeni anahtar + sorgu | Slug doğrulaması (aşağıda) |
| `services/[slug]`, `blog/[slug]` | Bilinmeyen slug `notFound()`'a gitmeden önce ~3 işlem harcıyor | Slug doğrulaması (aşağıda) |

**Slug doğrulaması.** `getAllLocalizedSlugs()` zaten dillere göre geçerli slug kümesini
döndürüyor ve kendisi de önbelleklenecek (tek girdi). `getService`, `getPost`,
`resolveServiceSlug` ve `resolvePostSlug` önbelleksiz ince bir sarmalayıcı alacak: slug bu
kümede değilse **veritabanına inmeden** `null` dönecek. Böylece hem bot taraması bedava
duracak, hem de önbellek anahtarı uzayı gerçek slug'larla sınırlı kalacak.

**Davranış değişikliği (bilinçli).** Bugün `?page=999` boş bir liste render ediyor; kırpma
sonrası son sayfayı gösterecek. Bunu iyileştirme sayıyorum — boş/yinelenen sayfa arama
motorları için zararlı. Alternatif `notFound()` döndürmekti; daha sert bir değişiklik
olduğu için seçilmedi.

### Etiketler neden kaba

Beş kaba etiket kullanılıyor, satır bazlı ince etiket değil. İçerik hacmi küçük (13 hizmet,
13 yazı) ve ince etiketleme "unutulmuş etiket" hatasına açık. Bir hizmet düzenlendiğinde
bütün hizmet girdileri tazelenir; bunun bedeli birkaç sorgu, kazancı ise doğruluk.

### Güvenlik tavanı: `revalidate: 86400`

Etiketler her içerik kaydında temizleniyor, yani normal akışta tavan hiç devreye girmez.
Tavan yalnızca bir etiket unutulursa ya da veritabanı panel dışından değişirse (script,
elle düzenleme) devreye girer ve bayatlığı **en fazla bir günle** sınırlar — "süresiz bayat"
karşı hedefini kapatan şey budur.

Bedeli hesaplandı. Girdi sayısı üst sınırı: ayarlar 1, sayfa içeriği 3 dil × ~2 varyant = 6,
hizmet listesi 3, hizmet detayı 13×3 = 39, hizmet slug çözümü 39, referanslar 1, yazı
listesi 3, yazı detayı 39, yazı slug çözümü 39, yayın sayısı 3, sayfalı liste ~6, slug
haritası 1 → **~180 girdi**. Günde bir tazelenirse **~180 işlem/gün ≈ 5.400/ay**, yani
kotanın ~%2,7'si. Bugünkü ~240.000/ay ile kıyaslanınca rahat.

Daha kısa tavan (örneğin 1 saat) bu sayıyı 4.300/gün'e çıkarıp kazancın çoğunu yerdi.
`revalidate: false` ise işlem sayısını sıfıra indirirdi ama unutulmuş bir etiket içeriği
süresiz dondururdu; karşı hedefe aykırı.

### Etiket temizleme

İçeriğe dokunan 23 server action'a `revalidateTag` eklenecek. Mevcut `revalidatePath`
çağrıları **kaldırılmayacak** — zararsızlar ve ileride B'ye geçilirse gerekli olacaklar.

| Tablo | Action'lar | Etiket |
|---|---|---|
| `service`, `serviceTranslation` | `updateServiceAction`, `createServiceAction`, `deleteServiceAction`, `moveServiceAction`, `setServiceVisibleAction`, `archiveServiceAction`, `restoreServiceAction` | `services` |
| `pageContent` | `updateContentAction` | `page-content` |
| `reference` | `addReferenceAction`, `updateReferenceFullAction`, `moveReferenceAction`, `updateReferenceAction`, `deleteReferenceAction`, `setReferenceVisibleAction`, `archiveReferenceAction`, `restoreReferenceAction` | `references` |
| `setting` | `updateSettingsAction` | `settings` |
| `post`, `postTranslation` | `createPostAction`, `updatePostAction`, `deletePostAction`, `setPostPublishedAction`, `archivePostAction`, `restorePostAction` | `posts` |

`user`, `loginAttempt`, `contactMessage` tablolarına dokunan action'lar public içeriği
etkilemiyor; onlara etiket eklenmeyecek.

### Doğrulama (veritabanı gerektirmeyen)

Projenin test biçimi korunacak: `scripts/check-*.ts`, `tsx` ile çalışır, çıkış kodu 0/1.
Bu işin testleri **statik** olacak, çünkü veritabanı kapalı:

- `scripts/check-cache-tags.ts`
  - `content.ts`'te Prisma'ya inen her dışa aktarılan okuma fonksiyonunun sarmalanmış olduğunu doğrular (yeni bir okuma eklenip sarmalanmazsa test kırılır)
  - İçerik tablolarına yazan her server action'ın `revalidateTag` çağırdığını doğrular
  - `user`/`loginAttempt`/`contactMessage` action'larının gereksiz yere etiket temizlemediğini doğrular
  - Kullanılan etiketlerin tanımlı beş etiketten biri olduğunu doğrular (yazım hatası yakalar)

Ek olarak `tsc --noEmit`, eslint ve `npm run build` yeşil olmalı.

**Veritabanı açılınca yapılacak (bu işin kapsamı dışında, ayrı adım):** panelden bir
içerik kaydedip yayında anında göründüğünü doğrulamak ve Prisma panosundan işlem
sayısının düştüğünü ölçmek.

## Kapsam dışı, açıkça

- **Bayat içerikle ayakta kalma (stale-if-error).** Kota yeniden dolarsa ya da veritabanı
  erişilemezse süresi geçmiş önbellek girdisini hata yerine servis etmek bu işin kapsamında
  **değil**. Dayanıklılık katmanı ayrı bir tasarım kararı ve "bayat içerik" karşı hedefiyle
  doğrudan çatışıyor; karıştırılmadan ele alınmalı.
- **Yönetim paneli okumaları.** Panel her sayfa görüntülemesinde `requireSession()` (1 `user`
  sorgusu) artı kendi sorgularını yapıyor ve bunlar önbelleklenmiyor — tasarım gereği, panel
  taze veri görmek zorunda. Yoğun panel kullanımı kotada görünmeye devam edecek.

## Riskler

- **Mekanizmanın çalıştığı çalışma zamanında kanıtlanmıyor.** Statik testler kodun şeklini
  doğruluyor, `unstable_cache` + `revalidateTag` ikilisinin `force-dynamic` altında Next
  16.4.6'da beklendiği gibi davrandığını **kanıtlamıyor**. Veritabanı kapalıyken uçtan uca
  doğrulama yapılamıyor; bu risk bilinçli olarak veritabanı açıldığı ana devrediliyor.
  Açıldığında ilk iş: panelden bir içerik kaydedip yayında anında göründüğünü görmek ve
  Prisma panosundan işlem sayısını ölçmek.
- **Kazanç ölçülmedi, tahmin edildi.** 200.745 işlemin ne kadarının public render, ne
  kadarının panel, bot veya script olduğu bilinmiyor; Prisma panosu bu kırılımı veriyorsa
  bakılmalı. "%95+ düşüş" beklentisi, işlemlerin ezici çoğunluğunun public render olduğu
  varsayımına dayanıyor. Kabul ölçütü: bir sonraki tam dönemde aylık işlem sayısı
  **50.000'in altında** olmalı; değilse kalan kaynak ayrıca araştırılmalı.

## Benim kararlarım (builder'a bırakılmayanlar)

- Kaba etiketler (beş adet), ince etiketleme değil — gerekçe yukarıda
- `revalidate: 86400` — aritmetiği yukarıda
- Mevcut `revalidatePath` çağrıları korunuyor
- Panel okumaları önbelleklenmiyor (zaten `content.ts` kullanmıyorlar)
- React `cache()` eklenmiyor — kota açısından gereksiz, kapsamı şişirir
- `mail.ts` ayarları önbelleksiz okuyor (sırlar önbelleğe girmesin, gerekçe yukarıda)
- Slug doğrulaması ve sayfa kırpması önbelleğin **dışında** — anahtar uzayını sınırlamanın tek yolu bu
- `?page=` aralık dışıysa son sayfaya kırpılıyor, `notFound()` değil

## Builder'a bırakılanlar

- `unstable_cache` sarmalayıcılarının dosya içi düzeni (her fonksiyonu ayrı sarmalamak mı,
  ortak bir yardımcı mı) — davranış aynı kaldığı sürece serbest
- `keyParts` adlandırması (argümansız `getSettings` için açık anahtar gerekir)
- `revalidateTag` çağrılarının action'lara nasıl yerleştirileceği (ortak yardımcı önerilir)
- Test betiğinin ayrıştırma yöntemi
