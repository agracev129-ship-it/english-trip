import { describe, expect, it } from 'vitest';
import { readContentFiles } from '../../scripts/content-files.ts';
import { validateContent } from '../content/validate.ts';
import { buildLesson, lineTokens, wordKey } from './lessonBuilder';

const { weeks } = validateContent(readContentFiles());
const week1 = weeks.find((w) => w.id === 'm1w1')!;
const plan = (day: number) => week1.lessons.find((l) => l.day === day)!;

describe('lessonBuilder', () => {
  it('день 1: знакомство со словами, выбор на слух, диалог, пары, диктант', () => {
    const items = buildLesson({ week: week1, plan: plan(1), dueWords: [], seed: 1 });
    const kinds = items.map((i) => i.kind);
    expect(kinds.filter((k) => k === 'word_intro')).toHaveLength(7);
    expect(kinds.filter((k) => k === 'word_listen_choice')).toHaveLength(7);
    expect(kinds).toContain('dialog_comprehension');
    expect(kinds).toContain('interactive_transcript');
    expect(kinds.filter((k) => k === 'minimal_pairs')).toHaveLength(6);
    expect(kinds.filter((k) => k === 'dictation_tiles')).toHaveLength(3);
    // в уроке минимум 5 разных типов заданий
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(5);
  });

  it('карточки на повторение появляются, только если есть что повторять', () => {
    const none = buildLesson({ week: week1, plan: plan(2), dueWords: [], seed: 1 });
    expect(none.some((i) => i.kind === 'flashcard_swipe')).toBe(false);
    const due = Array.from({ length: 20 }, (_, i) => `m1w1/w${i}`);
    const some = buildLesson({ week: week1, plan: plan(2), dueWords: due, seed: 1 });
    const fc = some.find((i) => i.kind === 'flashcard_swipe');
    expect(fc && fc.kind === 'flashcard_swipe' && fc.words).toHaveLength(15);
  });

  it('варианты выбора: 4 разных, правильный среди них', () => {
    const items = buildLesson({ week: week1, plan: plan(1), dueWords: [], seed: 7 });
    for (const it of items) {
      if (it.kind !== 'word_listen_choice') continue;
      expect(it.options).toHaveLength(4);
      expect(new Set(it.options).size).toBe(4);
      expect(it.options).toContain(it.word);
    }
  });

  it('плитки диктанта: все слова реплики плюс 2 лишних', () => {
    const items = buildLesson({ week: week1, plan: plan(1), dueWords: [], seed: 3 });
    for (const it of items) {
      if (it.kind !== 'dictation_tiles') continue;
      const l = week1.listenings.find((x) => x.id === it.listening)!;
      const tokens = lineTokens(l.lines[it.line]!.text);
      expect(it.tiles).toHaveLength(tokens.length + 2);
      for (const t of tokens) expect(it.tiles).toContain(t);
    }
  });

  it('одинаковое зерно — одинаковый урок', () => {
    const a = buildLesson({ week: week1, plan: plan(1), dueWords: [], seed: 99 });
    const b = buildLesson({ week: week1, plan: plan(1), dueWords: [], seed: 99 });
    expect(a).toEqual(b);
  });

  it('все 7 дней всех недель собираются без ошибок', () => {
    for (const w of weeks) {
      for (const p of w.lessons) {
        const items = buildLesson({
          week: w,
          plan: p,
          dueWords: [wordKey(w.id, w.words[0]!.id)],
          seed: 5,
        });
        expect(items.length).toBeGreaterThan(3);
      }
    }
  });

  it('lineTokens убирает пунктуацию, но оставляет апострофы', () => {
    expect(lineTokens('Yes, and any liquids too.')).toEqual([
      'Yes',
      'and',
      'any',
      'liquids',
      'too',
    ]);
    expect(lineTokens("I'll meet you in arrivals.")).toEqual([
      "I'll",
      'meet',
      'you',
      'in',
      'arrivals',
    ]);
  });
});
