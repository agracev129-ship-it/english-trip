// Главное условие этапа 2: она может 7 дней подряд проходить уроки недели 1,
// и прогресс, стрик и повторения считаются правильно. Дата подменяется, база — имитация IndexedDB.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readContentFiles } from '../../scripts/content-files.ts';
import { validateContent } from '../content/validate.ts';
import { resetProgress } from './backup';
import { db, type LessonRun } from './db';
import { finishRun, gradeWord, introduceWord, recordAnswer, saveRun, startRun } from './progress';

const { weeks } = validateContent(readContentFiles());
const week = weeks.find((w) => w.id === 'm1w1')!;
const planOf = (day: number) => week.lessons.find((l) => l.day === day)!;

/** Проходит урок так, как это делают задания: слова, ответы, шаги — и завершает его. */
async function passLesson(day: number) {
  const run: LessonRun = await startRun(week, planOf(day));
  for (let i = 0; i < run.items.length; i++) {
    const item = run.items[i]!;
    if (item.kind === 'word_intro') await introduceWord(item.word);
    const words =
      item.kind === 'word_listen_choice'
        ? [item.word]
        : item.kind === 'flashcard_swipe'
          ? item.words
          : [];
    for (const w of words) await gradeWord(w, 'good');
    if (item.kind === 'word_listen_choice' || item.kind === 'minimal_pairs') {
      await recordAnswer({
        item: i,
        kind: item.kind,
        skill: 'listening',
        correct: true,
        firstTry: true,
        normalSpeed: true,
        itemIds: [],
        at: Date.now(),
      });
    }
    run.stepIndex = i + 1;
    await saveRun(run);
  }
  return { run, summary: await finishRun(run) };
}

const at = (d: number, h = 19, min = 0) => new Date(2026, 10, d, h, min);

beforeEach(async () => {
  // Подменяем только дату: таймеры нужны самой базе
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(at(1));
  await resetProgress();
});
afterEach(() => vi.useRealTimers());

describe('неделя занятий', () => {
  it('7 дней подряд: стрик, заморозка, статистика, повторение слов', async () => {
    const flashcardsByDay: number[] = [];
    for (let day = 1; day <= 7; day++) {
      vi.setSystemTime(at(1 + day));
      const { run, summary } = await passLesson(day);
      expect(summary.streak.streak.current).toBe(day);
      const fc = run.items.find((i) => i.kind === 'flashcard_swipe');
      flashcardsByDay.push(fc && fc.kind === 'flashcard_swipe' ? fc.words.length : 0);
      // В уроке минимум 5 разных типов заданий, кроме первого дня без повторения — там тоже 5+
      if (day <= 4) expect(new Set(run.items.map((i) => i.kind)).size).toBeGreaterThanOrEqual(5);
    }

    // День 1 без карточек, со второго дня слова возвращаются на повторение
    expect(flashcardsByDay[0]).toBe(0);
    expect(flashcardsByDay[1]).toBeGreaterThan(0);

    const streak = await db.streak.get('streak');
    expect(streak).toMatchObject({ current: 7, best: 7, freezes: 1 });

    const runs = await db.lessonRuns.toArray();
    expect(runs.filter((r) => r.finishedAt)).toHaveLength(7);
    const days = await db.dailyStats.toArray();
    expect(days).toHaveLength(7);
    expect(days.every((d) => d.lessons === 1)).toBe(true);
    expect(days.reduce((s, d) => s + d.xp, 0)).toBeGreaterThan(7 * 50);

    // Все 28 слов недели введены и имеют карточки
    expect(await db.wordStates.count()).toBe(week.words.length);
  });

  it('заморозка спасает пропущенный день, а второй пропуск без неё сбрасывает', async () => {
    for (let day = 1; day <= 7; day++) {
      vi.setSystemTime(at(1 + day));
      await passLesson(day);
    }
    // Дни занятий: 2–8 ноября. 9 ноября пропущен, заморозка тратится
    vi.setSystemTime(at(10));
    const lesson = await passLessonAgain(1);
    expect(lesson.streak.freezesUsed).toBe(1);
    expect(lesson.streak.streak).toMatchObject({ current: 8, freezes: 0 });
    // Два дня пропуска без заморозок — стрик начинается заново, лучший остаётся
    vi.setSystemTime(at(13));
    const after = await passLessonAgain(2);
    expect(after.streak.streak).toMatchObject({ current: 1, best: 8 });
  });

  it('урок в 01:30 ночи засчитывается во вчерашний день', async () => {
    vi.setSystemTime(at(2));
    await passLesson(1);
    vi.setSystemTime(at(4, 1, 30)); // ночь на 4-е — это ещё 3-е число
    const { summary } = await passLesson(2);
    expect(summary.streak.streak).toMatchObject({ current: 2, lastActiveDate: '2026-11-03' });
  });

  it('второй урок за день не увеличивает стрик', async () => {
    vi.setSystemTime(at(2));
    await passLesson(1);
    vi.setSystemTime(at(2, 21));
    const { summary } = await passLesson(2);
    expect(summary.streak.alreadyCounted).toBe(true);
    expect(summary.streak.streak.current).toBe(1);
    expect((await db.dailyStats.get('2026-11-02'))?.lessons).toBe(2);
  });

  it('незаконченный урок продолжается с того же места и с теми же заданиями', async () => {
    vi.setSystemTime(at(2));
    const first = await startRun(week, planOf(1));
    first.stepIndex = 5;
    await saveRun(first);
    const resumed = await startRun(week, planOf(1));
    expect(resumed.id).toBe(first.id);
    expect(resumed.stepIndex).toBe(5);
    expect(resumed.items).toEqual(first.items);
    expect(await db.lessonRuns.count()).toBe(1);
  });

  it('повторное прохождение урока создаёт новый заход и не ломает уже пройденный', async () => {
    vi.setSystemTime(at(2));
    await passLesson(1);
    const again = await startRun(week, planOf(1));
    expect(again.stepIndex).toBe(0);
    expect(again.finishedAt).toBeUndefined();
    expect((await db.lessonRuns.toArray()).filter((r) => r.finishedAt)).toHaveLength(1);
  });
});

async function passLessonAgain(day: number) {
  return (await passLesson(day)).summary;
}
