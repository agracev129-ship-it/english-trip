// Статистика (PROJECT.md, 5.8 и раздел 9): минуты по дням, точность на слух по неделям,
// итоги периода, календарь активности. Только чистые функции — всё покрыто тестами.
import { addDays, diffDays, weekStart } from './day';

/** Минимум полей дневной статистики, нужный для подсчётов. */
export type DayStat = {
  date: string;
  seconds: number;
  lessons: number;
  xp: number;
  listenTotalNormal: number;
  listenCorrectNormal: number;
  wordsReviewed: number;
};

export type Bar = { date: string; label: string; minutes: number; isToday: boolean };

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const minutesOf = (seconds: number) => Math.round(seconds / 60);

/** 45 → «45 мин», 225 → «3ч 45м» (как «3h 45m» в референсе). */
export function formatMinutes(m: number): string {
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)}ч ${m % 60}м`;
}

function byDate(days: DayStat[]): Map<string, DayStat> {
  return new Map(days.map((d) => [d.date, d]));
}

/** Неделя Пн–Вс, в которую входит today. */
export function weekBars(days: DayStat[], today: string): Bar[] {
  const map = byDate(days);
  const mon = weekStart(today);
  return WEEKDAYS.map((label, i) => {
    const date = addDays(mon, i);
    return {
      date,
      label,
      minutes: minutesOf(map.get(date)?.seconds ?? 0),
      isToday: date === today,
    };
  });
}

/** Последние 4 недели: по столбику на неделю, подпись — дата понедельника. */
export function monthBars(days: DayStat[], today: string): Bar[] {
  const thisMon = weekStart(today);
  return [3, 2, 1, 0].map((back) => {
    const mon = addDays(thisMon, -7 * back);
    const seconds = days
      .filter((d) => diffDays(mon, d.date) >= 0 && diffDays(mon, d.date) < 7)
      .reduce((s, d) => s + d.seconds, 0);
    const [, m, dd] = mon.split('-');
    return {
      date: mon,
      label: `${Number(dd)}.${m}`,
      minutes: minutesOf(seconds),
      isToday: back === 0,
    };
  });
}

export type Totals = {
  minutes: number;
  lessons: number;
  xp: number;
  wordsReviewed: number;
  /** Точность на слух за период (0…1) или null, если ответов не было */
  listening: number | null;
  listeningAnswers: number;
};

/** Итоги за дни [from, to] включительно. */
export function totals(days: DayStat[], from: string, to: string): Totals {
  const inRange = days.filter((d) => diffDays(from, d.date) >= 0 && diffDays(d.date, to) >= 0);
  const sum = (f: (d: DayStat) => number) => inRange.reduce((s, d) => s + f(d), 0);
  const answers = sum((d) => d.listenTotalNormal);
  return {
    minutes: minutesOf(sum((d) => d.seconds)),
    lessons: sum((d) => d.lessons),
    xp: sum((d) => d.xp),
    wordsReviewed: sum((d) => d.wordsReviewed),
    listening: answers ? sum((d) => d.listenCorrectNormal) / answers : null,
    listeningAnswers: answers,
  };
}

export type WeekPoint = { weekStart: string; label: string; accuracy: number; answers: number };

/**
 * Главная метрика: доля верных первых попыток на слух в обычной скорости, по неделям.
 * Недели без ответов пропускаются.
 */
export function listeningByWeek(days: DayStat[]): WeekPoint[] {
  const weeks = new Map<string, { t: number; c: number }>();
  for (const d of days) {
    if (!d.listenTotalNormal) continue;
    const w = weekStart(d.date);
    const acc = weeks.get(w) ?? { t: 0, c: 0 };
    acc.t += d.listenTotalNormal;
    acc.c += d.listenCorrectNormal;
    weeks.set(w, acc);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([w, { t, c }]) => {
      const [, m, dd] = w.split('-');
      return { weekStart: w, label: `${Number(dd)}.${m}`, accuracy: c / t, answers: t };
    });
}

/** Сравнение точности на слух этой недели с прошлой (в процентных пунктах). */
export function listeningDelta(days: DayStat[], today: string): number | null {
  const mon = weekStart(today);
  const cur = totals(days, mon, today).listening;
  const prev = totals(days, addDays(mon, -7), addDays(mon, -1)).listening;
  if (cur === null || prev === null) return null;
  return Math.round((cur - prev) * 100);
}

export type CalendarCell = { date: string; day: number; active: boolean; isToday: boolean } | null;

/** Календарь месяца (как в Habitz): недели с понедельника, дни с уроками отмечены. */
export function monthCalendar(days: DayStat[], today: string): CalendarCell[][] {
  const [y, m] = today.split('-').map(Number) as [number, number];
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const total = new Date(y, m, 0).getDate();
  const offset = diffDays(weekStart(first), first);
  const active = new Set(days.filter((d) => d.lessons > 0).map((d) => d.date));
  const cells: CalendarCell[] = Array.from({ length: offset }, () => null);
  for (let i = 0; i < total; i++) {
    const date = addDays(first, i);
    cells.push({ date, day: i + 1, active: active.has(date), isToday: date === today });
  }
  while (cells.length % 7) cells.push(null);
  const rows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export const MONTHS_RU = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];
