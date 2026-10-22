// Нажатие на слово в тексте: ищем, входит ли оно в словарь курса,
// в том числе как часть фразы («boarding pass», «take off»).
import { lineTokens } from './lessonBuilder';

export type VocabEntry = { key: string; en: string };

const norm = (t: string) => t.toLowerCase().replace(/[’']/g, "'");

/**
 * Самая длинная словарная фраза, которая покрывает слово с индексом `index`.
 * Возвращает ключ слова и диапазон [start, end) слов реплики.
 */
export function findVocabAt(
  tokens: string[],
  index: number,
  vocab: VocabEntry[],
): { key: string; start: number; end: number } | null {
  const lower = tokens.map(norm);
  let best: { key: string; start: number; end: number } | null = null;
  for (const v of vocab) {
    const parts = lineTokens(v.en).map(norm);
    if (!parts.length) continue;
    // Окно фразы должно накрывать нажатое слово
    for (let start = Math.max(0, index - parts.length + 1); start <= index; start++) {
      if (start + parts.length > lower.length) break;
      if (parts.every((p, i) => matches(lower[start + i]!, p))) {
        if (!best || parts.length > best.end - best.start) {
          best = { key: v.key, start, end: start + parts.length };
        }
      }
    }
  }
  return best;
}

/** Простые формы: «costs» ↔ «cost», «towels» ↔ «towel», «landed» ↔ «land». */
function matches(token: string, base: string): boolean {
  if (token === base) return true;
  return ['s', 'es', 'ed', 'd', 'ing'].some((suf) => token === base + suf);
}
