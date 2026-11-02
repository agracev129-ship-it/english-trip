import { describe, expect, it } from 'vitest';
import { mascotMessage } from './mascotMessage';
import { daysWord, lessonsWord, wordsWord } from './plural';
import { collectReport, reportText, weekRangeLabel } from './report';
import { EMPTY_STREAK, streakStatus, type Streak } from './streak';

const TODAY = '2026-11-03';
const streak = (current: number, lastActiveDate: string | null, freezes = 0): Streak => ({
  current,
  best: current,
  lastActiveDate,
  freezes,
});
const msg = (s: Streak, dueWords = 0, anyLessonDone = true, hour = 12) =>
  mascotMessage({
    streak: s,
    status: streakStatus(s, TODAY),
    today: TODAY,
    dueWords,
    anyLessonDone,
    hour,
  });

describe('plural', () => {
  it('окончания по числу', () => {
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map(daysWord)).toEqual([
      'день',
      'дня',
      'дней',
      'дней',
      'дней',
      'день',
      'дня',
      'дней',
      'дней',
    ]);
    expect(wordsWord(3)).toBe('слова');
    expect(lessonsWord(0)).toBe('уроков');
  });
});

describe('реплика маскота', () => {
  it('первый запуск — знакомство', () => {
    expect(msg(EMPTY_STREAK, 0, false)).toMatchObject({ state: 'idle', title: 'Привет! Я Эхо' });
  });
  it('урок сегодня пройден — хвалит', () => {
    expect(msg(streak(4, TODAY))).toMatchObject({ state: 'happy', title: 'Ты молодец!' });
    expect(msg(streak(4, TODAY)).text).toContain('4 дня подряд');
  });
  it('урок пройден, но много слов на повторение — зовёт повторить', () => {
    expect(msg(streak(4, TODAY), 12)).toMatchObject({
      title: 'Пора повторить 12 слов',
      to: '/review',
    });
  });
  it('вчера занималась: днём не тревожит, вечером и ночью — стрик под угрозой', () => {
    expect(msg(streak(5, '2026-11-02'))).toMatchObject({ state: 'fire', title: '5 дней подряд!' });
    expect(msg(streak(5, '2026-11-02')).urgent).toBeUndefined();
    for (const hour of [20, 23, 1]) {
      expect(msg(streak(5, '2026-11-02'), 0, true, hour)).toMatchObject({
        title: 'Стрик под угрозой',
        urgent: true,
      });
    }
  });
  it('днём и маленький стрик — просто зовёт на урок', () => {
    expect(msg(streak(1, '2026-11-02'))).toMatchObject({ state: 'idle', title: 'Готова к уроку?' });
  });
  it('день уже пропущен — тревожит и днём', () => {
    expect(msg(streak(5, '2026-11-01', 1))).toMatchObject({ urgent: true });
  });
  it('пропустила день, но есть заморозка — говорит про неё', () => {
    expect(msg(streak(5, '2026-11-01', 1)).text).toContain('Заморозка');
  });
  it('давно не заходила — сонный и без упрёков', () => {
    expect(msg(streak(5, '2026-10-20'), 30)).toMatchObject({ state: 'sleepy' });
  });
});

describe('отчёт', () => {
  it('диапазон недели в одном и в двух месяцах', () => {
    expect(weekRangeLabel('2026-11-03')).toBe('2–8 ноября');
    expect(weekRangeLabel('2026-10-28')).toBe('26 октября – 1 ноября');
  });
  const day = (date: string, seconds: number, t: number, c: number, lessons = 1) => ({
    date,
    seconds,
    lessons,
    xp: 200,
    listenTotalNormal: t,
    listenCorrectNormal: c,
    wordsReviewed: 0,
  });
  it('текст со всеми показателями и ростом к прошлой неделе', () => {
    const r = collectReport({
      days: [
        day('2026-10-27', 1200, 10, 5),
        day('2026-11-02', 2700, 10, 7),
        day(TODAY, 2700, 10, 7),
      ],
      today: TODAY,
      name: 'Тест',
      learned: 21,
      streak: 2,
      best: 9,
    });
    const text = reportText(r);
    expect(text).toContain('English Trip, Тест: неделя 2–8 ноября');
    expect(text).toContain('Занятия: 1ч 30м, 2 урока');
    expect(text).toContain('Точность на слух: 70% (+20 к прошлой неделе)');
    expect(text).toContain('Выучено: 21 слово');
    expect(text).toContain('Стрик: 2 дня (лучший: 9)');
    expect(text).toContain('Уровень 2: Дублин');
  });
  it('без занятий и без имени текст не ломается', () => {
    const text = reportText(
      collectReport({ days: [], today: TODAY, name: '', learned: 0, streak: 0, best: 0 }),
    );
    expect(text).toContain('English Trip: неделя');
    expect(text).toContain('пока нет данных');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});
