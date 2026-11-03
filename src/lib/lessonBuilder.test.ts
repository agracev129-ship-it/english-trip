import { describe, expect, it } from 'vitest';
import { readContentFiles } from '../../scripts/content-files.ts';
import { validateContent } from '../content/validate.ts';
import { buildLesson, lineTokens, wordKey, type ItemKind, type LessonItem } from './lessonBuilder';

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
    expect(kinds.filter((k) => k === 'shadowing')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'minimal_pairs')).toHaveLength(4);
    expect(kinds.filter((k) => k === 'pattern_builder')).toHaveLength(3);
    expect(kinds.filter((k) => k === 'dictation_tiles')).toHaveLength(2);
  });

  it('условие этапа 3: в каждом уроке минимум 5 разных типов заданий', () => {
    const kindsOf = (items: LessonItem[]): ItemKind[] =>
      items.flatMap((i) =>
        i.kind === 'boss_week' ? [i.kind, ...kindsOf(i.steps.map((s) => s.item))] : [i.kind],
      );
    for (const w of weeks) {
      for (const p of w.lessons) {
        // Без повторения слов и без «Скажи фразу» — самый бедный случай
        const items = buildLesson({ week: w, plan: p, dueWords: [], seed: 11 });
        expect(new Set(kindsOf(items)).size, p.id).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('«Скажи фразу» появляется, только если включено и поддерживается', () => {
    const off = buildLesson({ week: week1, plan: plan(5), dueWords: [], seed: 1 });
    expect(off.some((i) => i.kind === 'say_it')).toBe(false);
    const on = buildLesson({ week: week1, plan: plan(5), dueWords: [], seed: 1, allowSayIt: true });
    expect(on.filter((i) => i.kind === 'say_it')).toHaveLength(2);
  });

  it('буквы для сборки слова: все буквы слова, без пробелов', () => {
    const items = buildLesson({ week: week1, plan: plan(2), dueWords: [], seed: 4 });
    const spell = items.filter((i) => i.kind === 'word_listen_spell');
    expect(spell).toHaveLength(3);
    for (const it of spell) {
      if (it.kind !== 'word_listen_spell') continue;
      const en = week1.words.find((w) => wordKey(week1.id, w.id) === it.word)!.en;
      expect([...it.letters].sort().join('')).toBe([...en.replace(/\s/g, '')].sort().join(''));
    }
  });

  it('«Поймай слово»: цель есть в реплике', () => {
    const items = buildLesson({ week: week1, plan: plan(3), dueWords: [], seed: 8 });
    const catches = items.filter((i) => i.kind === 'catch_the_word');
    expect(catches).toHaveLength(3);
    for (const it of catches) {
      if (it.kind !== 'catch_the_word') continue;
      const text = week1.listenings.find((l) => l.id === it.listening)!.lines[it.line]!.text;
      expect(lineTokens(text)).toContain(it.target);
    }
  });

  it('«Лестница скорости»: 3 ступени, верный перевод среди вариантов', () => {
    const items = buildLesson({ week: week1, plan: plan(5), dueWords: [], seed: 8 });
    const ladder = items.find((i) => i.kind === 'speed_ladder');
    if (ladder?.kind !== 'speed_ladder') throw new Error('нет лестницы');
    const ru = week1.listenings.find((l) => l.id === ladder.listening)!.lines[ladder.line]!.ru;
    expect(ladder.rounds.map((r) => r.speed)).toEqual([0.75, 1, 1.25]);
    for (const r of ladder.rounds) {
      expect(r.options).toContain(ru);
      expect(new Set(r.options).size).toBe(r.options.length);
    }
  });

  it('босс: цепочка из 6–8 заданий, все собираются', () => {
    for (const w of weeks) {
      const items = buildLesson({ week: w, plan: w.lessons[6]!, dueWords: [], seed: 2 });
      const boss = items.find((i) => i.kind === 'boss_week');
      if (boss?.kind !== 'boss_week') throw new Error(`${w.id}: нет босса`);
      expect(boss.steps.length).toBeGreaterThanOrEqual(6);
      expect(boss.steps.length).toBeLessThanOrEqual(8);
      expect(new Set(boss.steps.map((s) => s.item.kind)).size).toBeGreaterThanOrEqual(5);
    }
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
