// Сборка урока: план дня из контента (LessonPlan) → конкретный список заданий.
// Урок собирается один раз и сохраняется в базе, поэтому после выхода продолжается
// ровно с того же места и с теми же вариантами ответов.
import type { LessonPlan, Week } from '../content/schema';
import { pick, seededRng, shuffle, type Rng } from './random';

/** Слово везде обозначается ключом «m1w1/boarding-pass»: id слов уникальны только внутри недели. */
export const wordKey = (weekId: string, wordId: string) => `${weekId}/${wordId}`;

/** Скорости «лестницы»: одна фраза всё быстрее. */
export const LADDER_SPEEDS = [0.75, 1, 1.25] as const;

export type LessonItem =
  | { kind: 'word_intro'; word: string }
  | { kind: 'word_listen_choice'; word: string; options: string[] }
  | { kind: 'word_listen_spell'; word: string; letters: string[] }
  | { kind: 'flashcard_swipe'; words: string[] }
  | { kind: 'match_pairs'; words: string[] }
  | { kind: 'minimal_pairs'; pair: string; target: 'a' | 'b' }
  | { kind: 'numbers_listen'; drill: string }
  | { kind: 'dialog_comprehension'; listening: string; speedDelta: number }
  | { kind: 'interactive_transcript'; listening: string }
  | { kind: 'dictation_tiles'; listening: string; line: number; tiles: string[] }
  | { kind: 'dictation_typing'; listening: string; line: number }
  | { kind: 'catch_the_word'; listening: string; line: number; target: string }
  | {
      kind: 'speed_ladder';
      listening: string;
      line: number;
      /** Варианты перевода на каждой ступени; верный — перевод этой реплики */
      rounds: { speed: number; options: string[] }[];
    }
  | { kind: 'shadowing'; listening: string; line: number }
  | { kind: 'say_it'; listening: string; line: number }
  | { kind: 'pattern_builder'; pattern: string; index: number; options: string[] }
  | { kind: 'branching_dialog' }
  | { kind: 'boss_week'; steps: { storyRu: string; item: LessonItem }[] }
  | { kind: 'ai_conversation' };

export type ItemKind = LessonItem['kind'];

export type BuildInput = {
  week: Week;
  plan: LessonPlan;
  /** Слова (ключи), которым пора на повторение, самые «просроченные» первыми */
  dueWords: string[];
  seed: number;
  /** «Скажи фразу» включено в настройках и работает на этом телефоне */
  allowSayIt?: boolean;
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

const parseLine = (ref: string) => {
  const [listening, idx] = ref.split('#');
  return { listening: listening!, line: Number(idx) };
};

/** Цель для «Поймай слово»: одно из самых длинных слов реплики — его легче заметить. */
function catchTarget(text: string, rng: Rng): string {
  const tokens = lineTokens(text).filter((t) => t.length >= 3);
  const pool = [...tokens].sort((a, b) => b.length - a.length).slice(0, 3);
  return pool[Math.floor(rng() * pool.length)] ?? lineTokens(text)[0]!;
}

function ladderRounds(week: Week, listeningId: string, line: number, rng: Rng) {
  const l = week.listenings.find((x) => x.id === listeningId)!;
  const right = l.lines[line]!.ru;
  const others = [...new Set(l.lines.map((x) => x.ru))].filter((ru) => ru !== right);
  return LADDER_SPEEDS.map((speed) => ({
    speed,
    options: shuffle([right, ...pick(others, 2, rng)], rng),
  }));
}

/** Один шаг плана → задания. */
function expand(
  week: Week,
  step: { type: string; ref?: string[]; params?: Record<string, unknown> },
  rng: Rng,
  input: Pick<BuildInput, 'dueWords' | 'allowSayIt'>,
): LessonItem[] {
  const items: LessonItem[] = [];
  const allWords = week.words.map((w) => w.id);
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
    case 'word_listen_spell': {
      const ids = ref.length ? ref : pick(allWords, count ?? 3, rng);
      for (const id of ids) {
        const en = week.words.find((w) => w.id === id)!.en.toLowerCase();
        items.push({
          kind: 'word_listen_spell',
          word: wordKey(week.id, id),
          letters: shuffle(en.replace(/[^a-z']/g, '').split(''), rng),
        });
      }
      break;
    }
    case 'flashcard_swipe': {
      const max = typeof step.params?.max === 'number' ? step.params.max : 15;
      const words = input.dueWords.slice(0, max);
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
        const speedDelta = typeof step.params?.speedDelta === 'number' ? step.params.speedDelta : 0;
        items.push({ kind: 'dialog_comprehension', listening: id, speedDelta });
      }
      break;
    case 'interactive_transcript':
      for (const id of ref) items.push({ kind: 'interactive_transcript', listening: id });
      break;
    case 'dictation_tiles':
      for (const r of ref) {
        const { listening, line } = parseLine(r);
        items.push({
          kind: 'dictation_tiles',
          listening,
          line,
          tiles: dictationTiles(week, listening, line, rng),
        });
      }
      break;
    case 'dictation_typing':
      for (const r of ref) items.push({ kind: 'dictation_typing', ...parseLine(r) });
      break;
    case 'catch_the_word':
      for (const r of ref) {
        const { listening, line } = parseLine(r);
        const text = week.listenings.find((l) => l.id === listening)!.lines[line]!.text;
        items.push({ kind: 'catch_the_word', listening, line, target: catchTarget(text, rng) });
      }
      break;
    case 'speed_ladder':
      for (const r of ref) {
        const { listening, line } = parseLine(r);
        items.push({
          kind: 'speed_ladder',
          listening,
          line,
          rounds: ladderRounds(week, listening, line, rng),
        });
      }
      break;
    case 'shadowing':
      for (const r of ref) items.push({ kind: 'shadowing', ...parseLine(r) });
      break;
    case 'say_it':
      if (input.allowSayIt) {
        for (const r of ref) items.push({ kind: 'say_it', ...parseLine(r) });
      }
      break;
    case 'pattern_builder':
      for (const id of ref) {
        const p = week.patterns.find((x) => x.id === id)!;
        p.items.forEach((it, index) => {
          items.push({
            kind: 'pattern_builder',
            pattern: id,
            index,
            options: shuffle([it.answer, ...it.wrong], rng),
          });
        });
      }
      break;
    case 'branching_dialog':
      if (week.branching) items.push({ kind: 'branching_dialog' });
      break;
    case 'boss_week':
      if (week.boss) {
        items.push({
          kind: 'boss_week',
          steps: week.boss.steps.flatMap((s) => {
            // В шаблоне босс берёт только один пункт, чтобы шаг оставался одним заданием
            const item = expand(week, s, rng, input)[0];
            return item ? [{ storyRu: s.storyRu, item }] : [];
          }),
        });
      }
      break;
    case 'ai_conversation':
      items.push({ kind: 'ai_conversation' });
      break;
  }
  return items;
}

export function buildLesson({ week, plan, dueWords, seed, allowSayIt }: BuildInput): LessonItem[] {
  const rng = seededRng(seed);
  return plan.steps.flatMap((step) => expand(week, step, rng, { dueWords, allowSayIt }));
}

/** Задания со словами, которые после ошибки повторяются в конце урока. */
export function isRetryable(item: LessonItem): boolean {
  return item.kind === 'word_listen_choice' || item.kind === 'word_listen_spell';
}
