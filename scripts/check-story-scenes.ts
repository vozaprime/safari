// storyScenes davranış testleri.  npx tsx scripts/check-story-scenes.ts
import { DEFAULT_SCENES, resolveScenes, bandIndices, stickyProgress, type Scene } from "../src/lib/storyScenes";

let failures = 0;

function same(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** Varsayilanlar dekoratiftir: alt metinleri bostur. */
const asScenes = (srcs: readonly string[]): Scene[] => srcs.map((src) => ({ src, alt: "" }));

function expectScenes(
  settings: Record<string, string>,
  bodyImages: Scene[] | undefined,
  want: readonly Scene[],
  note: string
) {
  const got = resolveScenes(settings, bodyImages);
  const same2 =
    got.length === want.length && got.every((g, i) => g.src === want[i].src && g.alt === want[i].alt);
  if (same2) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${JSON.stringify(want)}\n     gelen   : ${JSON.stringify(got)}`);
    failures++;
  }
}

function expectBands(paragraphCount: number, sceneCount: number, want: number[], note: string) {
  const got = bandIndices(paragraphCount, sceneCount);
  if (same(got, want)) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${JSON.stringify(want)}\n     gelen   : ${JSON.stringify(got)}`);
    failures++;
  }
}

// --- resolveScenes ---
expectScenes({}, undefined, asScenes(DEFAULT_SCENES), "ayar yoksa dort varsayilan dondurulur");
expectScenes(
  { about_scene_2: "/u/a.jpg" },
  undefined,
  asScenes([DEFAULT_SCENES[0], "/u/a.jpg", DEFAULT_SCENES[2], DEFAULT_SCENES[3]]),
  "tek ayar dolu, digerleri varsayilana duser"
);
expectScenes({ about_scene_1: "   " }, undefined, asScenes(DEFAULT_SCENES), "yalnizca bosluk iceren ayar varsayilana duser");
expectScenes({ about_scene_3: "" }, undefined, asScenes(DEFAULT_SCENES), "bos string ayar varsayilana duser");
expectScenes(
  {},
  [{ src: "/u/b.jpg", alt: "1988 ofisi" }],
  [...asScenes(DEFAULT_SCENES), { src: "/u/b.jpg", alt: "1988 ofisi" }],
  "govdedeki gorsel alt metniyle birlikte havuzun sonuna eklenir"
);
expectScenes(
  { about_scene_1: "  /u/c.jpg  " },
  undefined,
  asScenes(["/u/c.jpg", DEFAULT_SCENES[1], DEFAULT_SCENES[2], DEFAULT_SCENES[3]]),
  "ayar degerinin bastaki/sondaki bosluklari kirpilir"
);

// --- bandIndices ---
expectBands(7, 4, [0, 2, 4, 6], "7 paragraf 4 sahne -> dort serit");
expectBands(3, 4, [0, 1, 2], "paragraf sahneden az -> aralik disina tasmaz");
expectBands(10, 4, [0, 3, 6, 9], "10 paragraf 4 sahne");
expectBands(1, 4, [0], "tek paragraf -> tek serit");
expectBands(0, 4, [], "bos govde -> serit yok");

// --- stickyProgress ---
// Panel `stickyTop`'ta sabitlenir; ilerleme, panelin sabit kaldigi sureyi
// olcmeli. Bolumun tamamini olcen eski yaklasimda cubuk, panel ekranda
// goruldukten cok sonra dolmaya basliyor ve bitmeden once doluyordu.
const H = 1600; // bolum yuksekligi
const P = 740; // panel yuksekligi
const T = 104; // sticky top
function expectProgress(rectTop: number, want: number, note: string) {
  const got = stickyProgress(rectTop, H, P, T);
  if (Math.abs(got - want) < 0.001) {
    console.log(`ok: ${note}`);
  } else {
    console.error(`FAIL: ${note}\n     beklenen: ${want}\n     gelen   : ${got}`);
    failures++;
  }
}
expectProgress(T, 0, "panel tam sabitlendiginde ilerleme 0");
expectProgress(T - (H - P) / 2, 0.5, "yolun yarisinda ilerleme 0.5");
expectProgress(T - (H - P), 1, "panel sabitligi biterken ilerleme 1");
expectProgress(600, 0, "bolum henuz gelmediyse 0'a kirpilir");
expectProgress(-5000, 1, "bolum gectiyse 1'e kirpilir");

if (stickyProgress(T, 500, 740, T) !== 0) {
  console.error("FAIL: bolum panelden kisaysa ilerleme 0 olmali");
  failures++;
} else {
  console.log("ok: bolum panelden kisaysa ilerleme 0 (sifira bolme yok)");
}

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
