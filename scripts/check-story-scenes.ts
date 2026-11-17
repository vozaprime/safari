// storyScenes davranış testleri.  npx tsx scripts/check-story-scenes.ts
import { DEFAULT_SCENES, resolveScenes, bandIndices } from "../src/lib/storyScenes";

let failures = 0;

function same(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function expectScenes(
  settings: Record<string, string>,
  bodyImages: string[] | undefined,
  want: readonly string[],
  note: string
) {
  const got = resolveScenes(settings, bodyImages);
  if (same(got, want)) {
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
expectScenes({}, undefined, DEFAULT_SCENES, "ayar yoksa dort varsayilan dondurulur");
expectScenes(
  { about_scene_2: "/u/a.jpg" },
  undefined,
  [DEFAULT_SCENES[0], "/u/a.jpg", DEFAULT_SCENES[2], DEFAULT_SCENES[3]],
  "tek ayar dolu, digerleri varsayilana duser"
);
expectScenes({ about_scene_1: "   " }, undefined, DEFAULT_SCENES, "yalnizca bosluk iceren ayar varsayilana duser");
expectScenes({ about_scene_3: "" }, undefined, DEFAULT_SCENES, "bos string ayar varsayilana duser");
expectScenes({}, ["/u/b.jpg"], [...DEFAULT_SCENES, "/u/b.jpg"], "govdedeki gorsel sahne havuzunun sonuna eklenir");
expectScenes(
  { about_scene_1: "  /u/c.jpg  " },
  undefined,
  ["/u/c.jpg", DEFAULT_SCENES[1], DEFAULT_SCENES[2], DEFAULT_SCENES[3]],
  "ayar degerinin bastaki/sondaki bosluklari kirpilir"
);

// --- bandIndices ---
expectBands(7, 4, [0, 2, 4, 6], "7 paragraf 4 sahne -> dort serit");
expectBands(3, 4, [0, 1, 2], "paragraf sahneden az -> aralik disina tasmaz");
expectBands(10, 4, [0, 3, 6, 9], "10 paragraf 4 sahne");
expectBands(1, 4, [0], "tek paragraf -> tek serit");
expectBands(0, 4, [], "bos govde -> serit yok");

console.log(failures ? `\n${failures} HATA` : "\nhata yok");
process.exit(failures ? 1 : 0);
