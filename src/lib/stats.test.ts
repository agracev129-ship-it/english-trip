import { describe, expect, it } from 'vitest';
import {
  listeningByWeek,
  listeningDelta,
  monthBars,
  monthCalendar,
  totals,
  weekBars,
  type DayStat,
} from './stats';

const day = (date: string, p: Partial<DayStat> = {}): DayStat => ({
  date,
  seconds: 0,
  lessons: 0,
  xp: 0,
  listenTotalNormal: 0,
  listenCorrectNormal: 0,
  wordsReviewed: 0,
  ...p,
});

// 2026-10-22 — четверг, неделя с 19.10
const TODAY = '2026-10-22';

describe('weekBars', () => {
  it('7 дней Пн–Вс, минуты округляются, сегодня отмечено', () => {
    const bars = weekBars(
      [day('2026-10-19', { seconds: 1290 }), day(TODAY, { seconds: 60 })],
      TODAY,
    );
    expect(bars.map((b) => b.label)).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
    expect(bars[0]!.minutes).toBe(22); // 21.5 мин → 22
    expect(bars[3]).toMatchObject({ date: TODAY, minutes: 1, isToday: true });
    expect(bars[6]!.date).toBe('2026-10-25');
  });
});

describe('monthBars', () => {
  it('4 недели, последняя — текущая', () => {
    const bars = monthBars(
      [
        day('2026-10-01', { seconds: 600 }),
        day('2026-10-20', { seconds: 1200 }),
        day(TODAY, { seconds: 600 }),
      ],
      TODAY,
    );
    expect(bars.map((b) => b.date)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
    ]);
    expect(bars[0]!.minutes).toBe(10);
    expect(bars[3]).toMatchObject({ minutes: 30, isToday: true, label: '19.10' });
  });
});

describe('totals', () => {
  it('суммы и точность за период, границы включительно', () => {
    const days = [
      day('2026-10-18', { seconds: 6000, lessons: 5 }), // вне периода
      day('2026-10-19', {
        seconds: 1200,
        lessons: 1,
        xp: 120,
        listenTotalNormal: 10,
        listenCorrectNormal: 7,
      }),
      day(TODAY, {
        seconds: 1800,
        lessons: 1,
        xp: 100,
        listenTotalNormal: 10,
        listenCorrectNormal: 9,
      }),
    ];
    expect(totals(days, '2026-10-19', TODAY)).toEqual({
      minutes: 50,
      lessons: 2,
      xp: 220,
      wordsReviewed: 0,
      listening: 0.8,
      listeningAnswers: 20,
    });
  });
  it('без ответов на слух — null, а не 0%', () => {
    expect(totals([day(TODAY, { seconds: 60 })], TODAY, TODAY).listening).toBeNull();
  });
});

describe('listeningByWeek', () => {
  it('группирует по неделям с понедельника, пропускает пустые', () => {
    const pts = listeningByWeek([
      day('2026-10-13', { listenTotalNormal: 10, listenCorrectNormal: 4 }),
      day('2026-10-18', { listenTotalNormal: 10, listenCorrectNormal: 6 }),
      day('2026-10-20', { seconds: 100 }),
      day(TODAY, { listenTotalNormal: 5, listenCorrectNormal: 4 }),
    ]);
    expect(pts).toEqual([
      { weekStart: '2026-10-12', label: '12.10', accuracy: 0.5, answers: 20 },
      { weekStart: '2026-10-19', label: '19.10', accuracy: 0.8, answers: 5 },
    ]);
  });
  it('рост к прошлой неделе в процентных пунктах', () => {
    const days = [
      day('2026-10-14', { listenTotalNormal: 10, listenCorrectNormal: 5 }),
      day(TODAY, { listenTotalNormal: 10, listenCorrectNormal: 7 }),
    ];
    expect(listeningDelta(days, TODAY)).toBe(20);
    expect(listeningDelta([days[1]!], TODAY)).toBeNull();
  });
});

describe('monthCalendar', () => {
  it('октябрь 2026 начинается с четверга, дни с уроками отмечены', () => {
    const rows = monthCalendar(
      [day('2026-10-01', { lessons: 1 }), day('2026-10-02', { seconds: 60 })],
      TODAY,
    );
    expect(rows[0]!.slice(0, 3)).toEqual([null, null, null]);
    expect(rows[0]![3]).toMatchObject({ day: 1, active: true });
    expect(rows[0]![4]).toMatchObject({ day: 2, active: false });
    expect(rows.flat().filter(Boolean)).toHaveLength(31);
    expect(rows.every((r) => r.length === 7)).toBe(true);
    expect(rows.flat().find((c) => c?.isToday)?.day).toBe(22);
  });
});
