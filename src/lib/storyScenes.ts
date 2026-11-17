/**
 * Hakkımızda anlatısının görsel sahneleri ve mobil şerit yerleşimi.
 *
 * Sahneler panelden yönetilir (`Setting` tablosunda `about_scene_1..4`), bu
 * yüzden dilden bağımsızdır: bir görseli değiştirmek tek işlemdir. Alan boşsa
 * o sahne varsayılana düşer, böylece panel hiç dokunulmamışken de bölüm
 * eksiksiz görünür.
 */

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
export function resolveScenes(settings: Record<string, string>, bodyImages?: string[]): string[] {
  const scenes = DEFAULT_SCENES.map((fallback, i) => {
    const value = (settings[`about_scene_${i + 1}`] ?? "").trim();
    return value || fallback;
  });
  for (const raw of bodyImages ?? []) {
    const value = (raw ?? "").trim();
    if (value) scenes.push(value);
  }
  return scenes;
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
