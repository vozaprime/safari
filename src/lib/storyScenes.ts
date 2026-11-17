/**
 * Hakkımızda anlatısının görsel sahneleri ve mobil şerit yerleşimi.
 *
 * Sahneler panelden yönetilir (`Setting` tablosunda `about_scene_1..4`), bu
 * yüzden dilden bağımsızdır: bir görseli değiştirmek tek işlemdir. Alan boşsa
 * o sahne varsayılana düşer, böylece panel hiç dokunulmamışken de bölüm
 * eksiksiz görünür.
 */

/** Bir sahne: görsel yolu ve (varsa) panelden gelen alt metni. */
export type Scene = { src: string; alt: string };

/** Panelde karşılığı olmayan sahneler için varsayılan görseller. */
export const DEFAULT_SCENES = [
  "/images/services/sirket-kurulusu.jpg", // kuruluş, Cağaloğlu, şubeler
  "/images/about.jpg", // stratejik danışmanlığa geçiş, bugünün hizmetleri
  "/images/services/ticaret-is-gelistirme.jpg", // çözüm ortaklıkları, değerler
  "/images/heroes/services.jpg", // gelecek vizyonu
] as const;

/**
 * Ayarlardan sahne görsellerini çözer. Boş veya yalnızca boşluk içeren bir
 * ayar, kırık bir görsel yerine varsayılana düşer.
 *
 * `bodyImages`, metne panelden gömülmüş görsellerdir; metin akışından çıkarılıp
 * sahne havuzunun sonuna eklenirler, böylece hiçbir görsel kaybolmaz.
 */
export function resolveScenes(settings: Record<string, string>, bodyImages?: Scene[]): Scene[] {
  // Ayarlardan gelen sahnelerin alt metni yoktur; dekoratiftirler.
  const scenes: Scene[] = DEFAULT_SCENES.map((fallback, i) => {
    const value = (settings[`about_scene_${i + 1}`] ?? "").trim();
    return { src: value || fallback, alt: "" };
  });
  // Govdeye gomulu gorseller alt metinleriyle birlikte tasinir: eski
  // ProseText yolunda bu metin figcaption olarak gorunuyordu, kaybolmamali.
  for (const raw of bodyImages ?? []) {
    const src = (raw?.src ?? "").trim();
    if (src) scenes.push({ src, alt: (raw?.alt ?? "").trim() });
  }
  return scenes;
}

/**
 * Yapışkan panelin sabit kaldığı süre boyunca okuma ilerlemesi (0..1).
 *
 * `useScrollStage`'in varsayılan ölçüsü, kendisini sabitleyen uzun kapsayıcılar
 * için yazılmış: bölümün tamamını ölçer (`yükseklik - viewport`). Burada bölüm
 * doğal yükseklikte ve yalnızca içindeki panel yapışkan; o ölçüyle ilerleme,
 * panel ekranda göründükten çok sonra başlıyor ve panel hâlâ sabitken 1'e
 * varıyordu — çubuk, bölümün ortasındaki dar bir aralıkta birden doluyordu.
 *
 * Doğru aralık panelin yolculuğudur: bölümün üstü `stickyTop`'a değdiğinde 0,
 * bölümün altı panelin altına geldiğinde 1.
 */
export function stickyProgress(
  rectTop: number,
  sectionHeight: number,
  panelHeight: number,
  stickyTop: number
): number {
  const travel = sectionHeight - panelHeight;
  if (travel <= 0) return 0;
  const p = (stickyTop - rectTop) / travel;
  return Math.min(1, Math.max(0, p));
}

/**
 * `xl` altında, yapışkan panel kapalıyken her sahnenin görselinin hangi
 * paragrafın önüne şerit olarak gireceğini verir.
 *
 * Paragraf sayısı panelden değişebildiği için grup boyutu metne göre
 * hesaplanır; paragraf sayısı sahne sayısından azsa aralık dışına taşmaz.
 */
export function bandIndices(paragraphCount: number, sceneCount: number): number[] {
  if (paragraphCount <= 0 || sceneCount <= 0) return [];
  const group = Math.max(1, Math.ceil(paragraphCount / sceneCount));
  const out: number[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const index = i * group;
    if (index >= paragraphCount) break;
    out.push(index);
  }
  return out;
}
