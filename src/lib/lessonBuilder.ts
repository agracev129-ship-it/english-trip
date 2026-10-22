// Сборка урока: план дня из контента (LessonPlan) → конкретный список заданий.
// Урок собирается один раз и сохраняется в базе, поэтому после выхода продолжается
// ровно с того же места и с теми же вариантами ответов.
import type { LessonPlan, Week } from '../content/schema';
import { pick, seededRng, shuffle, type Rng } from './random';

/** Слово везде обозначается ключом «m1w1/boarding-pass»: id слов уникальны только внутри недели. */
export const wordKey = (weekId: string, wordId: string) => `${weekId}/${wordId}`;

export type LessonItem =
  | { kind: 'word_intro'; word: string }
  | { kind: 'word_listen_choice'; word: string; options: string[] }
  | { kind: 'flashcard_swipe'; words: string[] }
  | { kind: 'match_pairs'; words: string[] }
  | { kind: 'minimal_pairs'; pair: string; target: 'a' | 'b' }
  | { kind: 'numbers_listen'; drill: string }
  | { kind: 'dialog_comprehension'; listening: string; speedDelta: number }
  | { kind: 'interactive_transcript'; listening: string }
  | { kind: 'dictation_tiles'; listening: string; line: number; tiles: string[] }
  | { kind: 'ai_conversation' };

export type ItemKind = LessonItem['kind'];

/** Задания, которые есть в приложении сейчас (MVP, этап 2). Остальные типы шагов пропускаются. */
export const SUPPORTED: ReadonlySet<string> = new Set<ItemKind>([
  'word_intro',
  'word_listen_choice',
  'flashcard_swipe',
  'match_pairs',
  'minimal_pairs',
  'numbers_listen',
  'dialog_comprehension',
  'interactive_transcript',
  'dictation_tiles',
  'ai_conversation',
]);

export type BuildInput = {
  week: Week;
  plan: LessonPlan;
  /** Слова (ключи), которым пора на повторение, самые «просроченные» первыми */
  dueWords: string[];
  seed: number;
};

/** Слова реплики для плиток диктанта: без пунктуации по краям. */
export function lineTokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => t.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, ''))
    .filter(Boolean);
}

function choiceOptions(week: Week, wordId: string, rng: Rng): string[] {
  const target = week.words.find((w) => w.id === wordId)!;
  const others = week.words.filter((w) => w.id !== wordId && w.ru !== target.ru);
  const samePos = others.filter((w) => w.pos === target.pos);
  const pool = samePos.length >= 3 ? samePos : others;
  const options = [target, ...pick(pool, 3, rng)];
  return shuffle(options, rng).map((w) => wordKey(week.id, w.id));
}

function dictationTiles(week: Week, listeningId: string, line: number, rng: Rng): string[] {
  const l = week.listenings.find((x) => x.id === listeningId)!;
  const tokens = lineTokens(l.lines[line]!.text);
  const used = new Set(tokens.map((t) => t.toLowerCase()));
  const candidates = [
    ...l.lines.filter((_, i) => i !== line).flatMap((x) => lineTokens(x.text)),
    ...week.words.flatMap((w) => lineTokens(w.en)),
  ].filter((t) => !used.has(t.toLowerCase()) && t.length > 2);
  const traps = pick([...new Map(candidates.map((t) => [t.toLowerCase(), t])).values()], 2, rng);
  return shuffle([...tokens, ...traps], rng);
}

export function buildLesson({ week, plan, dueWords, seed }: BuildInput): LessonItem[] {
  const rng = seededRng(seed);
  const items: LessonItem[] = [];
  const allWords = week.words.map((w) => w.id);

  for (const step of plan.steps) {
    if (!SUPPORTED.has(step.type)) continue;
    const ref = step.ref ?? [];
    const count = typeof step.params?.count === 'number' ? step.params.count : undefined;

    switch (step.type) {
      case 'word_intro':
        for (const id of ref) items.push({ kind: 'word_intro', word: wordKey(week.id, id) });
        break;
      case 'word_listen_choice': {
        const ids = ref.length ? shuffle(ref, rng) : pick(allWords, count ?? 10, rng);
        for (const id of ids) {
          items.push({
            kind: 'word_listen_choice',
            word: wordKey(week.id, id),
            options: choiceOptions(week, id, rng),
          });
        }
        break;
      }
      case 'flashcard_swipe': {
        const max = typeof step.params?.max === 'number' ? step.params.max : 15;
        const words = dueWords.slice(0, max);
        if (words.length) items.push({ kind: 'flashcard_swipe', words: shuffle(words, rng) });
        break;
      }
      case 'match_pairs': {
        const ids = pick(ref.length ? ref : allWords, Math.min(count ?? 5, 5), rng);
        items.push({ kind: 'match_pairs', words: ids.map((id) => wordKey(week.id, id)) });
        break;
      }
      case 'minimal_pairs': {
        const pool = ref.length ? ref : week.minimalPairs.map((p) => p.id);
        const n = count ?? pool.length;
        for (let i = 0; i < n; i++) {
          items.push({
            kind: 'minimal_pairs',
            pair: pool[Math.floor(rng() * pool.length)]!,
            target: rng() < 0.5 ? 'a' : 'b',
          });
        }
        break;
      }
      case 'numbers_listen': {
        const ids = ref.length
          ? ref
          : pick(
              week.numberDrills.map((d) => d.id),
              count ?? 5,
              rng,
            );
        for (const id of ids) items.push({ kind: 'numbers_listen', drill: id });
        break;
      }
      case 'dialog_comprehension':
        for (const id of ref) {
          const speedDelta =
            typeof step.params?.speedDelta === 'number' ? step.params.speedDelta : 0;
          items.push({ kind: 'dialog_comprehension', listening: id, speedDelta });
        }
        break;
      case 'interactive_transcript':
        for (const id of ref) items.push({ kind: 'interactive_transcript', listening: id });
        break;
      case 'dictation_tiles':
        for (const r of ref) {
          const [lid, idx] = r.split('#');
          const line = Number(idx);
          items.push({
            kind: 'dictation_tiles',
            listening: lid!,
            line,
            tiles: dictationTiles(week, lid!, line, rng),
          });
        }
        break;
      case 'ai_conversation':
        items.push({ kind: 'ai_conversation' });
        break;
    }
  }
  return items;
}

/** Задания со словами, которые после ошибки повторяются в конце урока. */
export function isRetryable(item: LessonItem): boolean {
  return item.kind === 'word_listen_choice';
}
