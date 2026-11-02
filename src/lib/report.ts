// Текст отчёта «Поделиться отчётом» (PROJECT.md, раздел 10): только агрегированная статистика.
import { addDays, keyToDate, weekStart } from './day';
import { daysWord, lessonsWord, wordsWord } from './plural';
import { toPercent } from './progress';
import { formatMinutes, listeningDelta, totals, type DayStat } from './stats';
import { levelInfo } from './xp';

const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/** «2–8 ноября» или «28 октября – 3 ноября». */
export function weekRangeLabel(today: string): string {
  const from = keyToDate(weekStart(today));
  const to = keyToDate(addDays(weekStart(today), 6));
  const end = `${to.getDate()} ${MONTHS_GEN[to.getMonth()]}`;
  return from.getMonth() === to.getMonth()
    ? `${from.getDate()}–${end}`
    : `${from.getDate()} ${MONTHS_GEN[from.getMonth()]} – ${end}`;
}

export type ReportData = {
  name: string;
  range: string;
  minutes: string;
  lessons: number;
  /** Точность на слух в процентах или null */
  listening: number | null;
  delta: number | null;
  learned: number;
  streak: number;
  best: number;
  level: number;
  city: string;
};

export function collectReport(input: {
  days: DayStat[];
  today: string;
  name: string;
  learned: number;
  streak: number;
  best: number;
}): ReportData {
  const { days, today, name, learned, streak, best } = input;
  const t = totals(days, weekStart(today), today);
  const level = levelInfo(days.reduce((s, d) => s + d.xp, 0));
  return {
    name,
    range: weekRangeLabel(today),
    minutes: formatMinutes(t.minutes),
    lessons: t.lessons,
    listening: t.listening === null ? null : toPercent(t.listening),
    delta: listeningDelta(days, today),
    learned,
    streak,
    best,
    level: level.level,
    city: level.city,
  };
}

/** Заголовок и подзаголовок карточки-картинки. */
export function reportTitleLines(r: ReportData): [string, string] {
  return r.name
    ? [r.name, `English Trip · неделя ${r.range}`]
    : ['English Trip', `Неделя ${r.range}`];
}

export function reportText(r: ReportData): string {
  const delta = r.delta === null ? '' : ` (${r.delta >= 0 ? '+' : ''}${r.delta} к прошлой неделе)`;
  return [
    `📊 English Trip${r.name ? `, ${r.name}` : ''}: неделя ${r.range}`,
    `⏱ Занятия: ${r.minutes}, ${r.lessons} ${lessonsWord(r.lessons)}`,
    `🎧 Точность на слух: ${r.listening === null ? 'пока нет данных' : `${r.listening}%${delta}`}`,
    `📚 Выучено: ${r.learned} ${wordsWord(r.learned)}`,
    `🔥 Стрик: ${r.streak} ${daysWord(r.streak)} (лучший: ${r.best})`,
    `✈️ Уровень ${r.level}: ${r.city}`,
  ].join('\n');
}
