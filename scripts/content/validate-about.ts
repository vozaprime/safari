// about_body gövdelerinin yayın öncesi doğrulaması.
//
// Ayrı bir modülde durur çünkü sırası kritik: üç dilin TAMAMI yazmadan önce
// denetlenmeli. Önceki sürümde denetim ve yazma aynı döngüdeydi, bu yüzden
// tr'ye yazılıp en'de durulabiliyor ve ekrana "hiçbir şey yazılmadı" yazılıyordu
// — paylaşılan canlı veritabanında diller birbirinden ayrışmış oluyordu.
import { parseBlocks } from "../../src/lib/richtext";

const MIN_PARAGRAPHS = 5;

/** Bir gövdenin sorunları; boş dizi "yazılabilir" demektir. */
export function aboutBodyProblems(value: string): string[] {
  const problems: string[] = [];
  const blocks = parseBlocks(value || "");

  const unexpected = [...new Set(blocks.filter((b) => b.kind !== "para").map((b) => b.kind))];
  if (unexpected.length) problems.push(`beklenmeyen blok türü: ${unexpected.join(", ")}`);

  const paragraphs = blocks.filter((b) => b.kind === "para").length;
  if (paragraphs < MIN_PARAGRAPHS) {
    problems.push(`${paragraphs} paragraf, en az ${MIN_PARAGRAPHS} bekleniyor`);
  }

  return problems;
}

/** Tüm dillerin sorunları, dil etiketiyle birlikte. */
export function allProblems(bodies: Record<string, string>): { locale: string; problem: string }[] {
  const out: { locale: string; problem: string }[] = [];
  for (const [locale, value] of Object.entries(bodies)) {
    for (const problem of aboutBodyProblems(value)) out.push({ locale, problem });
  }
  return out;
}
